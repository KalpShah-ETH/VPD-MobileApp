import { NextResponse } from 'next/server';

export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>VPD Sales API Server</h1>
      <p>This backend is now strictly serving the mobile application.</p>
    </div>
  );
}
