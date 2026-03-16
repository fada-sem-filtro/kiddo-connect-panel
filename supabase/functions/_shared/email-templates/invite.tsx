/// <reference types="npm:@types/react@18.3.1" />

import * as React from "npm:react@18.3.1";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";

interface InviteEmailProps {
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl: string;
}

export const InviteEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />

    <Preview>Seu acesso à Agenda Fleur foi criado 🌸</Preview>

    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} width="60" height="60" alt="Agenda Fleur" style={logo} />

        <Heading style={h1}>Seu acesso à Agenda Fleur foi criado 🌸</Heading>

        <Text style={text}>
          Você foi convidado(a) para utilizar a{" "}
          <Link href={siteUrl} style={link}>
            <strong>Agenda Fleur</strong>
          </Link>
          .
        </Text>

        <Text style={text}>
          A Agenda Fleur é uma plataforma criada para facilitar a comunicação entre escolas e famílias, organizando
          rotinas, eventos e informações importantes em um único lugar.
        </Text>

        <Text style={text}>Seu acesso já foi criado. Utilize os dados abaixo para entrar na plataforma:</Text>

        <Section style={credentialsBox}>
          <Text style={credentialsTitle}>Dados de acesso</Text>

          <Text style={credentialsItem}>
            📧 <strong>E-mail:</strong> {recipient}
          </Text>

          <Text style={credentialsItem}>
            🔑 <strong>Senha inicial:</strong> fleur@2026
          </Text>
        </Section>

        <Button style={button} href={confirmationUrl}>
          Acessar Agenda Fleur
        </Button>

        <Text style={securityText}>Por segurança, recomendamos alterar sua senha após o primeiro acesso.</Text>

        <Text style={footer}>Se você não esperava este convite, pode ignorar este e-mail com segurança.</Text>

        <Text style={footerBrand}>Agenda Fleur 🌸</Text>
      </Container>
    </Body>
  </Html>
);

export default InviteEmail;

const logoUrl = "https://takzcbagxjydlkzenprr.supabase.co/storage/v1/object/public/email-assets/logo-fleur-2.webp";

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "'Quicksand', Arial, sans-serif",
};

const container = {
  padding: "30px 25px",
  maxWidth: "480px",
  margin: "0 auto",
};

const logo = {
  margin: "0 0 20px",
};

const h1 = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "hsl(195, 30%, 20%)",
  margin: "0 0 20px",
};

const text = {
  fontSize: "14px",
  color: "hsl(195, 15%, 45%)",
  lineHeight: "1.6",
  margin: "0 0 18px",
};

const link = {
  color: "hsl(191, 76%, 45%)",
  textDecoration: "underline",
};

const credentialsBox = {
  backgroundColor: "#f6fbfc",
  borderRadius: "12px",
  padding: "16px",
  margin: "20px 0 28px",
  border: "1px solid #e3f2f5",
};

const credentialsTitle = {
  fontSize: "13px",
  fontWeight: "600" as const,
  margin: "0 0 10px",
  color: "hsl(195, 30%, 30%)",
};

const credentialsItem = {
  fontSize: "14px",
  margin: "4px 0",
  color: "hsl(195, 20%, 35%)",
};

const button = {
  backgroundColor: "hsl(191, 76%, 55%)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  borderRadius: "16px",
  padding: "14px 24px",
  textDecoration: "none",
  display: "inline-block",
};

const securityText = {
  fontSize: "12px",
  color: "hsl(195, 15%, 55%)",
  margin: "18px 0 0",
};

const footer = {
  fontSize: "12px",
  color: "hsl(195, 15%, 60%)",
  margin: "30px 0 0",
};

const footerBrand = {
  fontSize: "12px",
  color: "hsl(195, 15%, 50%)",
  margin: "8px 0 0",
};
