import { AccountActions } from "@/components/profile/account-actions";
import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SystemInfo } from "@/components/profile/system-info";

// Dummy data — no backend integration required (Sprint 008 Task 001)
const dummyUser = {
  name: "Yohan Pratama",
  email: "yohan@yohan.ai",
  role: "Super Admin",
  status: "active" as const,
  avatarUrl: "",
};

const userInformationFields = [
  { label: "Full Name", value: dummyUser.name },
  { label: "Email Address", value: dummyUser.email },
  { label: "Role", value: dummyUser.role },
  { label: "Phone", value: "+62 812 3456 7890" },
  { label: "Company", value: "Yohan.AI" },
  { label: "Joined", value: "July 2026" },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your account information.
        </p>
      </div>

      {/* Profile Header */}
      <ProfileHeader
        name={dummyUser.name}
        email={dummyUser.email}
        role={dummyUser.role}
        status={dummyUser.status}
        avatarUrl={dummyUser.avatarUrl}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <ProfileCard
            title="User Information"
            fields={userInformationFields}
          />
          <SystemInfo />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <AccountActions />
        </div>
      </div>
    </div>
  );
}