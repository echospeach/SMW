import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Terms of Service — SMW" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 20, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of SMW (the &quot;Service&quot;).
        By creating an account, you agree to these Terms.
      </p>

      <LegalSection heading="The service">
        <p>
          SMW helps you draft, schedule, and automatically publish social media content across
          platforms you connect (Facebook, Instagram, X, LinkedIn, TikTok, and YouTube). Content
          drafts may be generated with the assistance of AI (Anthropic&apos;s Claude).
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <LegalList
          items={[
            "You're responsible for keeping your login credentials confidential and for all activity under your account.",
            "You must provide accurate account information and keep it up to date.",
            "You must be legally able to enter into these Terms and to grant SMW permission to post on your behalf via the platforms you connect.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Connected platforms">
        <p>
          When you connect a social media account, you authorize SMW to publish content to it on
          your behalf, according to the schedule and automation rules you configure. You remain
          solely responsible for:
        </p>
        <LegalList
          items={[
            "The content you approve or schedule, including AI-generated drafts you choose to publish.",
            "Complying with each connected platform's own terms of service, community guidelines, and advertising policies.",
            "Any consequences of automated posting, including posts published by your configured Automation rules.",
          ]}
        />
        <p>
          You can disconnect any platform at any time from the Accounts screen, which immediately
          stops SMW from publishing to it.
        </p>
      </LegalSection>

      <LegalSection heading="AI-generated content">
        <p>
          Content Studio uses AI to generate draft captions and scripts based on the brief you
          provide. AI-generated drafts may be inaccurate, inappropriate, or require editing.
          You&apos;re responsible for reviewing any AI-generated content before it is published,
          whether manually or through an Automation rule.
        </p>
      </LegalSection>

      <LegalSection heading="Subscriptions and billing">
        <LegalList
          items={[
            "Paid plans are billed in advance on a monthly or annual basis through Stripe.",
            "You can upgrade, downgrade, or cancel your subscription at any time from the Billing screen.",
            "Cancellation takes effect at the end of your current billing period; we don't provide prorated refunds for unused time except where required by law.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to use the Service to:</p>
        <LegalList
          items={[
            "Publish content that is unlawful, infringing, defamatory, or violates a connected platform's policies.",
            "Attempt to disrupt, reverse-engineer, or gain unauthorized access to the Service.",
            "Use the Service on behalf of an account you're not authorized to manage.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Termination">
        <p>
          You may stop using the Service and delete your account at any time. We may suspend or
          terminate accounts that violate these Terms or misuse the Service.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimer of warranties">
        <p>
          The Service is provided &quot;as is&quot; without warranties of any kind. We don&apos;t
          guarantee that scheduled or automated posts will always publish successfully, or that
          AI-generated content will be accurate or suitable for your purposes.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the maximum extent permitted by law, SMW is not liable for indirect, incidental, or
          consequential damages arising from your use of the Service, including content published to
          connected platforms.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>These Terms are governed by the laws of [governing jurisdiction].</p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          We may update these Terms from time to time. Continued use of the Service after a change
          means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>Questions about these Terms can be sent to [contact email].</p>
      </LegalSection>
    </LegalPage>
  );
}
