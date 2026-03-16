/// <reference types="npm:@types/react@18.3.1" />

import * as React from "npm:react@18.3.1";

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
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
  confirmationUrl: string;
  recipient: string;
  schoolName?: string;
  userRole?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador(a)",
  diretor: "Diretor(a)",
  educador: "Educador(a)",
  responsavel: "Responsável",
};

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
  recipient,
  schoolName,
  userRole,
}: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu acesso à Agenda Fleur foi criado! 🌸</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} width="60" height="60" alt="Agenda Fleur" style={logo} />

        <Heading style={h1}>Seu acesso à Agenda Fleur foi criado 🌸</Heading>

        <Text style={text}>
          Olá! Você foi convidado(a) para utilizar a{" "}
          <Link href={siteUrl} style={link}>
            <strong>Agenda Fleur</strong>
          </Link>
          , a plataforma que facilita a comunicação entre escola e famílias, organizando rotinas,
          eventos e informações importantes do dia a dia.
        </Text>

        <Section style={accessBox}>
          <Heading as="h2" style={accessBoxTitle}>
            Dados de acesso
          </Heading>
          <Text style={accessItem}>
            <strong>E-mail:</strong> {recipient || "—"}
          </Text>
          <Text style={accessItem}>
            <strong>Senha inicial:</strong> fleur@2026
          </Text>
          {schoolName && (
            <Text style={accessItem}>
              <strong>Escola:</strong> {schoolName}
            </Text>
          )}
          {userRole && (
            <Text style={accessItem}>
              <strong>Tipo de usuário:</strong> {ROLE_LABELS[userRole] || userRole}
            </Text>
          )}
        </Section>

        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>
            Acessar Agenda Fleur
          </Button>
        </Section>

        <Text style={securityNote}>
          🔒 Por segurança, recomendamos alterar sua senha após o primeiro acesso.
        </Text>

        <Hr style={divider} />

        <Text style={footer}>
          Se você não esperava este convite, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InviteEmail;

const logoUrl =
  "https://takzcbagxjydlkzenprr.supabase.co/storage/v1/object/public/email-assets/logo-fleur-2.webp";

const main = {
  backgroundColor: "#f4f8fa",
  fontFamily: "'Quicksand', 'Segoe UI', Arial, sans-serif",
};

const container = {
  padding: "40px 30px",
  maxWidth: "520px",
  margin: "30px auto",
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e8eff3",
};

const logo = { margin: "0 auto 24px", display: "block" as const };

const h1 = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "hsl(195, 30%, 20%)",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const text = {
  fontSize: "14px",
  color: "hsl(195, 15%, 40%)",
  lineHeight: "1.7",
  margin: "0 0 24px",
};

const link = { color: "hsl(191, 76%, 45%)", textDecoration: "underline" };

const accessBox = {
  backgroundColor: "hsl(191, 60%, 96%)",
  border: "1px solid hsl(191, 50%, 88%)",
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "0 0 28px",
};

const accessBoxTitle = {
  fontSize: "15px",
  fontWeight: "700" as const,
  color: "hsl(191, 76%, 40%)",
  margin: "0 0 14px",
  letterSpacing: "0.3px",
};

const accessItem = {
  fontSize: "14px",
  color: "hsl(195, 20%, 30%)",
  lineHeight: "1.4",
  margin: "0 0 8px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "hsl(191, 76%, 53%)",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600" as const,
  borderRadius: "20px",
  padding: "14px 32px",
  textDecoration: "none",
  display: "inline-block" as const,
};

const securityNote = {
  fontSize: "13px",
  color: "hsl(195, 15%, 50%)",
  textAlign: "center" as const,
  margin: "0 0 24px",
  lineHeight: "1.5",
};

const divider = {
  borderColor: "hsl(195, 20%, 90%)",
  margin: "0 0 20px",
};

const footer = {
  fontSize: "12px",
  color: "hsl(195, 15%, 60%)",
  textAlign: "center" as const,
  margin: "0",
};
