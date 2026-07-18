import { NextResponse } from 'next/server';
export interface ApiResponse<T = unknown> {
success: boolean;
message: string;
data?: T;
errors?: Record<string, string[]>;
}
export const apiResponse = {
success: <T>(data: T, message = 'Operation successful', status = 200) =>
NextResponse.json<ApiResponse<T>>({ success: true, message, data }, { status }),
created: <T>(data: T, message = 'Resource created successfully') =>
NextResponse.json<ApiResponse<T>>({ success: true, message, data }, { status: 201 }),
badRequest: (message = 'Bad request', errors?: Record<string, string[]>) =>
NextResponse.json<ApiResponse>({ success: false, message, errors }, { status: 400 }),
unauthorized: (message = 'Unauthorized') =>
NextResponse.json<ApiResponse>({ success: false, message }, { status: 401 }),
forbidden: (message = 'Forbidden') =>
NextResponse.json<ApiResponse>({ success: false, message }, { status: 403 }),
notFound: (message = 'Resource not found') =>
NextResponse.json<ApiResponse>({ success: false, message }, { status: 404 }),
serverError: (message = 'Internal server error') =>
NextResponse.json<ApiResponse>({ success: false, message }, { status: 500 }),
};