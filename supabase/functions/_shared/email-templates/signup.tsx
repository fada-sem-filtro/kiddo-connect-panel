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
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail na Agenda Fleur 🌸</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={logoUrl} width="60" height="60" alt="Agenda Fleur" style={logo} />
        <Heading style={h1}>Bem-vindo(a) à Agenda Fleur! 🌸</Heading>
        <Text style={text}>
          Sua conta foi criada com sucesso! Para começar a usar a{' '}
          <Link href={siteUrl} style={link}>
            <strong>Agenda Fleur</strong>
          </Link>
          , confirme seu endereço de e-mail (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar E-mail ✨
        </Button>
        <Text style={footer}>
          Se você não criou uma conta, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'hsl(191, 76%, 45%)', textDecoration: 'underline' }
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
