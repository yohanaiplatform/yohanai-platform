export const metadata = {
  title: "Data Deletion Instructions — Yohan.AI",
};

export default function DataDeletionPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-sm sm:prose-base">
      <h1>User Data Deletion Instructions</h1>
      <p className="text-muted-foreground">Last updated: August 2026</p>

      <p>
        If you would like to delete your Yohan.AI account and all
        associated personal data, you have two options:
      </p>

      <h2>Option 1: Request via Email</h2>
      <p>
        Send an email to{" "}
        <a href="mailto:privacy@yohanai.id">privacy@yohanai.id</a> with the
        subject line &quot;Data Deletion Request&quot;, using the email
        address associated with your account. We will process your request
        and permanently delete your account and personal data within 30
        days, and confirm via email once completed.
      </p>

      <h2>Option 2: Delete via Account Settings</h2>
      <p>
        Log in to your Yohan.AI account, navigate to{" "}
        <strong>Profile</strong>, and use the account deletion option
        (available in an upcoming release). Until this feature is live,
        please use the email request method above.
      </p>

      <h2>What Gets Deleted</h2>
      <ul>
        <li>Your profile information (name, email, avatar)</li>
        <li>Your account credentials and login history</li>
        <li>Any leads, notes, or activity records you created, unless retention is required by law or legitimate business record-keeping</li>
      </ul>

      <h2>Facebook &amp; Google Login Users</h2>
      <p>
        Deleting your Yohan.AI account does not automatically revoke access
        permissions on Facebook or Google. To fully remove Yohan.AI&apos;s
        access to your Facebook or Google account, please also visit your
        Facebook or Google account settings and remove Yohan.AI from your
        list of connected apps.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about data deletion:{" "}
        <a href="mailto:privacy@yohanai.id">privacy@yohanai.id</a>
      </p>
    </div>
  );
}