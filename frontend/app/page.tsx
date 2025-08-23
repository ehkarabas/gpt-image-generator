"use client";

import { AdaptiveLayout } from "@/components/chat/layouts/adaptive-layout";

export default function Home() {
  return (
    <AdaptiveLayout 
      showSidebar={true}
      showDropdown={true}
    />
  );
}
