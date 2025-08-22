import { ProfileSettings } from "@/components/profile/profile-settings";

interface ProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}

/**
 * Profile Settings Page
 * Protected route - user must be authenticated
 * Uses simple layout without sidebar
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  {/* Content Container - Mobile Responsive */}
  return (
    <div className="!h-screen !w-screen bg-background flex flex-col justify-center items-center overflow-y-auto">
      <div className="w-fit max-w-6xl mx-auto px-4 py-8">
        <ProfileSettings userId={userId} />
      </div>
    </div>
  );
}