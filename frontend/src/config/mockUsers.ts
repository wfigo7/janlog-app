/**
 * モックユーザー定義（local環境用）
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  jwt: string;
}

/**
 * モックユーザー一覧
 */
export const MOCK_USERS: MockUser[] = [
  {
    id: 'test-user-001',
    name: 'テストユーザー',
    email: 'test@example.com',
    role: 'user',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMDAxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiY29nbml0bzp1c2VybmFtZSI6InRlc3QtdXNlci0wMDEiLCJjdXN0b206cm9sZSI6InVzZXIiLCJpc3MiOiJtb2NrLWlzc3VlciIsImF1ZCI6ImphbmxvZy1sb2NhbCIsImV4cCI6OTk5OTk5OTk5OSwiaWF0IjoxNzU3NjU5OTc4LCJ0b2tlbl91c2UiOiJpZCJ9.77Zs3A87mKdCCbCihmWLdAu0YhK5UCNRnJO6mcw_wRY',
  },
  {
    id: 'test-admin-001',
    name: 'テスト管理者',
    email: 'admin@example.com',
    role: 'admin',
    jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LWFkbWluLTAwMSIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJjb2duaXRvOnVzZXJuYW1lIjoidGVzdC1hZG1pbi0wMDEiLCJjdXN0b206cm9sZSI6ImFkbWluIiwiaXNzIjoibW9jay1pc3N1ZXIiLCJhdWQiOiJqYW5sb2ctbG9jYWwiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTc2MDAwNDY5MywidG9rZW5fdXNlIjoiaWQifQ.OyF0bOFNjAFsUD2sd5ZtWQGsIYFxcfz0VBXeaGFQjwg',
  },
];
