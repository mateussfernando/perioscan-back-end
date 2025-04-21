# PerioScan Backend

API Backend para gerenciamento de casos periciais odontolegal.

## Descrição

O PerioScan Backend é uma API RESTful construída com Node.js e Express que fornece recursos de autenticação, gerenciamento de usuários e gerenciamento de casos periciais odontológicos. O sistema implementa controle de acesso baseado em funções com três tipos de usuários: admin, perito e assistente.

## Tecnologias

- **Node.js & Express**: Framework para servidor
- **MongoDB & Mongoose**: Banco de dados e ODM
- **JWT**: Autenticação e autorização
- **bcryptjs**: Criptografia de senhas
- **Cloudinary**: Armazenamento em nuvem para imagens e arquivos
- **Multer**: Manipulação de upload de arquivos
- **PDFKit**: Geração de PDFs
- **QRCode**: Geração de códigos QR
- **Swagger**: Documentação da API

## Instalação

```bash
# Clone o repositório
git clone https://seu-repositorio-url/perioscan-backend.git
cd perioscan-backend

# Instale as dependências
npm install

# Crie o arquivo .env (veja a seção Variáveis de Ambiente)
touch .env

# Execute em modo de desenvolvimento
npm run dev

# Execute em modo de produção
npm start




## Variáveis de Ambiente

## Crie um arquivo `.env` no diretório raiz com as seguintes variáveis:


# Configuração do Servidor
PORT=3337
NODE_ENV=development

# Conexão com MongoDB
MONGO_URI=mongodb://sua-string-de-conexao-mongodb

# Configuração JWT
JWT_SECRET=sua-chave-secreta-para-jwt

# Configuração CORS
CLIENT_URL=http://localhost:3000

# Configuração Cloudinary (se estiver usando)
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=seu-api-secret


## Endpoints da API

### Autenticação

- **POST /api/auth/login**: Autenticar usuário e obter token


{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}


## Autenticação

## A API usa JWT (JSON Web Tokens) para autenticação. Para acessar rotas protegidas:

1. Obtenha um token fazendo login via `/api/auth/login`
2. Inclua o token no cabeçalho da requisição:


x-auth-token: seu-token-jwt
Os tokens expiram após 1 hora por padrão.



## Funções de Usuário

- **admin**: Acesso completo a todos os recursos, incluindo gerenciamento de usuários
- **perito**: Especialista forense com acesso ao gerenciamento de casos
- **assistente**: Assistente com acesso limitado aos casos


## Licença

Este projeto está licenciado sob a Licença MIT - consulte o arquivo LICENSE para obter detalhes.