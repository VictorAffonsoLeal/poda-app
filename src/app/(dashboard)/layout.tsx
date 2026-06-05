"use client";

import ChatWidget from "@/components/ChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="aplicativo-container" className="min-h-screen flex flex-col items-center p-4 py-8">
      {children}
      <ChatWidget />
    </div>
  );
}
