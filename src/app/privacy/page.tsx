import { C } from "@/lib/theme";
import { LegalList, LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata = { title: "Privacy Policy — SMW" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 20, 2026">
      <p>
        This policy explains what information SMW (&quot;we&quot;, &quot;us&quot;) collects when you
        use the SMW social media scheduling application (the &quot;Service&quot;), how we use it,
        and the choices you have.
      </p>

      <LegalSection heading="Information we collect">
        <p>We collect the following categories of information:</p>
        <LegalList
          items={[
            <>
              <strong>Account information:</strong> your email address and a securely hashed
              password. We never store your password in plain text.
            </>,
            <>
              <strong>Content you create:</strong> post drafts, topics, tone selections, and
              scheduling times you enter into Content Studio.
            </>,
            <>
              <strong>Connected platform data:</strong> when you connect a social media account
              (Facebook, Instagram, X, LinkedIn, TikTok, or YouTube), we store the access
              credentials needed to publish on your behalf, along with basic account identifiers
              (e.g. page name, handle) needed to display your connections.
            </>,
            <>
              <strong>Billing information:</strong> we do not store your payment card details.
              Payments are processed by Stripe, which maintains its own privacy practices — see{" "}
              <a href="https://stripe.com/privacy" style={{ color: C.amber }}>
                stripe.com/privacy
              </a>
              .
            </>,
            <>
              <strong>Usage data:</strong> standard technical logs (timestamps, error reports) used
              to operate and secure the Service.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="How we use your information">
        <LegalList
          items={[
            "To operate the Service: authenticating you, storing your drafts, and publishing scheduled or automated posts to the platforms you've connected.",
            "To generate content: when you use Content Studio, the topic, tone, and platform selections you provide are sent to Anthropic's Claude API to generate a draft. We do not send your connected account credentials or personal messages to Anthropic.",
            "To process payments and manage your subscription, via Stripe.",
            "To maintain and improve the security and reliability of the Service.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Third-party services">
        <p>SMW relies on the following third-party processors to operate:</p>
        <LegalList
          items={[
            <>
              <strong>Anthropic</strong> — generates post drafts and video scripts from the briefs
              you provide.
            </>,
            <>
              <strong>Stripe</strong> — processes subscription payments.
            </>,
            <>
              <strong>Neon</strong> — hosts our application database.
            </>,
            <>
              <strong>Vercel</strong> — hosts the application itself.
            </>,
            <>
              <strong>Facebook, Instagram, X, LinkedIn, TikTok, and YouTube</strong> — receive the
              content you choose to publish, only for the accounts you explicitly connect.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection heading="Data retention and deletion">
        <p>
          We retain your account data for as long as your account is active. You may request
          deletion of your account and all associated data at any time by contacting us at the
          address below. Disconnecting a social platform account immediately revokes our access to
          publish to it and removes the stored credentials for that connection.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          Depending on your location, you may have the right to access, correct, export, or delete
          your personal information, and to withdraw consent for us to process it. Contact us to
          exercise any of these rights.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Passwords are hashed and never stored in plain text. Connections to the Service and
          between our systems and third-party processors are encrypted in transit. No method of
          transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be reflected by
          updating the date at the top of this page.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>Questions about this policy can be sent to [contact email].</p>
      </LegalSection>
    </LegalPage>
  );
}
