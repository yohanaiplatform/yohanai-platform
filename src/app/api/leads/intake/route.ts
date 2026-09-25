import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePhone } from '@/lib/crm/normalizePhone'

/**
 * Pintu masuk lead dari Google Form legacy (Apps Script -> UrlFetchApp.fetch).
 *
 * Diamankan lewat secret header, bukan sesi login, karena pemanggilnya
 * mesin. Lihat docs/modules/crm.mdx bagian "Rencana Lead Intake dari
 * Google Form" untuk arsitektur lengkapnya.
 *
 * Hanya field mentah (input manusia di form) yang diterima di sini. Kolom
 * hasil AI Processor / Decision Engine / Property Matching Engine di
 * spreadsheet legacy sengaja TIDAK ikut dikirim — itu logika bisnis
 * terpisah yang belum diputuskan nasibnya (lihat docs/migration/migration-blueprint.mdx).
 */

const REQUIRED_FIELDS = ['nama', 'phone', 'sourceRowRef'] as const

interface LeadIntakePayload {
  nama: string
  phone: string
  /** Kunci dedup: "<spreadsheetId>:<rowNumber>", dibuat oleh Apps Script. */
  sourceRowRef: string
  sumberInformasi?: string
  kategori?: string
  permintaan?: string
  komentar?: string
  minatUnitLokasi?: string
  sudahSurvey?: string
  statusFunnel?: string
  followUpTerakhir?: string
  submittedAt?: string
}

/**
 * submittedAt datang dari Apps Script sebagai String(dateObject) --
 * format Date.prototype.toString() V8, mis. "Wed Jan 14 2026 20:56:02
 * GMT+0700 (Western Indonesia Time)". new Date() bisa parse ini langsung
 * karena origin-nya sama-sama V8 (Google Apps Script & Node.js/Vercel).
 *
 * created_at HARUS diisi tanggal submit asli, bukan waktu insert --
 * kalau tidak, backfill data lama bikin semua lead "masuk hari ini"
 * (created_at default now()), dan filter tanggal jadi tidak berguna.
 */
function parseSubmittedAt(value: string | undefined): string | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-intake-secret')
  if (!secret || secret !== process.env.LEADS_INTAKE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Partial<LeadIntakePayload>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const missing = REQUIRED_FIELDS.filter((field) => !body[field])
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Field wajib kosong: ${missing.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: existing, error: existingError } = await supabase
    .schema('customer')
    .from('leads')
    .select('id')
    .eq('metadata->>source_row_ref', body.sourceRowRef as string)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({ success: true, leadId: existing.id, duplicate: true })
  }

  const { data: source } = await supabase
    .schema('customer')
    .from('lead_sources')
    .select('id')
    .eq('name', 'Google Form')
    .maybeSingle()

  const createdAt = parseSubmittedAt(body.submittedAt)

  const { data: inserted, error: insertError } = await supabase
    .schema('customer')
    .from('leads')
    .insert({
      lead_source_id: source?.id ?? null,
      first_name: (body.nama as string).trim(),
      last_name: '',
      phone: normalizePhone(body.phone as string),
      status: 'new',
      ...(createdAt ? { created_at: createdAt } : {}),
      metadata: {
        origin: 'google_form_legacy',
        source_row_ref: body.sourceRowRef,
        sumber_informasi: body.sumberInformasi ?? null,
        kategori: body.kategori ?? null,
        permintaan: body.permintaan ?? null,
        komentar: body.komentar ?? null,
        minat_unit_lokasi: body.minatUnitLokasi ?? null,
        sudah_survey: body.sudahSurvey ?? null,
        status_funnel_awal: body.statusFunnel ?? null,
        follow_up_terakhir: body.followUpTerakhir ?? null,
        submitted_at: body.submittedAt ?? null,
      },
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Insert gagal' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, leadId: inserted.id })
}
