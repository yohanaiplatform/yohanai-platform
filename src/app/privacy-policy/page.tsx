export const metadata = {
  title: "Privacy Policy — Yohan.AI",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-sm sm:prose-base">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: August 2026</p>

      <p>
        Yohan.AI (&quot;we&quot;, &quot;our&quot;, &quot;the platform&quot;) is a Property Buyer
        Behavior Intelligence platform. This Privacy Policy explains how we
        collect, use, and protect your information when you use our
        services, including when you sign in using Google or Facebook.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li>Account information: name, email address, profile picture (when provided by Google or Facebook login)</li>
        <li>Usage data: pages visited, features used, interaction with our CRM and dashboard tools</li>
        <li>Contact information you provide when using our lead management features</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account</li>
        <li>To provide access to the Yohan.AI dashboard, CRM, and property management tools</li>
        <li>To communicate with you regarding your account or our services</li>
        <li>To improve our platform and develop new features</li>
      </ul>

      <h2>3. Third-Party Login (Google &amp; Facebook)</h2>
      <p>
        When you sign in using Google or Facebook, we receive basic profile
        information (name, email address, profile picture) as authorized by
        you during the login process. We do not post to your social media
        accounts on your behalf, and we do not access your contacts, posts,
        or other social media content beyond the basic profile information
        needed to create your account.
      </p>

      <h2>4. Data Storage &amp; Security</h2>
      <p>
        Your data is stored securely using Supabase, a PostgreSQL-based
        infrastructure provider with encryption at rest and in transit. We
        implement reasonable technical and organizational measures to
        protect your personal information from unauthorized access.
      </p>

      <h2>5. Data Sharing</h2>
      <p>
        We do not sell your personal information to third parties. We may
        share data with service providers strictly necessary to operate our
        platform (e.g., hosting and infrastructure providers), under
        confidentiality obligations.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        You have the right to access, correct, or delete your personal
        data. See our{" "}
        <a href="/data-deletion">Data Deletion Instructions</a> for details
        on how to request account and data deletion.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or how your data is
        handled, contact us at{" "}
        <a href="mailto:privacy@yohanai.id">privacy@yohanai.id</a>.
      </p>
    </div>
  );
}