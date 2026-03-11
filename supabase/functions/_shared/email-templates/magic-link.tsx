/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de acesso à Agenda Fleur</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} width="60" height="60" alt="Agenda Fleur" style={logo} />
        <Heading style={h1}>Seu link de acesso ✨</Heading>
        <Text style={text}>
          Clique no botão abaixo para entrar na Agenda Fleur.
          Este link expira em breve.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Entrar
        </Button>
        <Text style={footer}>
          Se você não solicitou este link, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const logoUrl = 'https://takzcbagxjydlkzenprr.supabase.co/storage/v1/object/public/email-assets/logo-fleur-2.webp'
const main = { backgroundColor: '#ffffff', fontFamily: "'Quicksand', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { margin: '0 0 20px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(195, 30%, 20%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(195, 15%, 45%)',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: 'hsl(191, 76%, 55%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '16px',
  padding: '14px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(195, 15%, 60%)', margin: '30px 0 0' }
