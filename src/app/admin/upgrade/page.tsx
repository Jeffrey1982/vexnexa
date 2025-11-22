import UpgradeClient from "./UpgradeClient";

export const dynamic = 'force-dynamic';

// Simple admin check
export default async function AdminUpgradePage() {
  
  return (
    <div className="min-h-screen bg-gray-50">
      <UpgradeClient />
    </div>
  );
}
