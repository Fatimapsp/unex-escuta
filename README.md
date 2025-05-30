# UNEX Escuta - API de Feedback Acadêmico

Uma API REST completa para sistema de feedback acadêmico, desenvolvida com Node.js, Express e MongoDB. Permite que estudantes avaliem professores, disciplinas e infraestrutura da instituição de ensino.

## 🚀 Funcionalidades

### Autenticação e Autorização
- Sistema de autenticação JWT
- Controle de acesso baseado em roles (estudante, professor, admin)
- Rate limiting para segurança
- Middleware de autorização para recursos específicos

### Gestão de Usuários
- Cadastro e login de usuários
- Perfis com diferentes níveis de acesso
- Atualização de dados pessoais
- Alteração de senha com verificação

### Sistema de Feedback
- Avaliação de professores (qualidade de ensino, clareza)
- Avaliação de disciplinas
- Avaliação de infraestrutura
- Feedback anônimo opcional
- Sistema de ratings (1-5 estrelas)

### Relatórios e Estatísticas
- Estatísticas gerais por tipo de feedback
- Estatísticas por semestre/ano acadêmico
- Ranking de professores e disciplinas
- Filtros avançados para consultas

### Gestão Acadêmica
- Cadastro de professores e disciplinas
- Gestão de infraestrutura
- Relacionamento entre entidades

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação baseada em tokens
- **bcryptjs** - Hash de senhas
- **express-validator** - Validação de dados
- **express-rate-limit** - Controle de taxa de requisições
- **helmet** - Middlewares de segurança
- **cors** - Controle de CORS

## 📁 Estrutura do Projeto

```
├── config/
│   └── db.js                 # Configuração do banco de dados
├── middleware/
│   └── auth.js              # Middlewares de autenticação
├── models/
│   ├── user.js              # Schema de usuários
│   ├── professor.js         # Schema de professores
│   ├── discipline.js        # Schema de disciplinas
│   ├── infrastructure.js    # Schema de infraestrutura
│   └── feedback.js          # Schema de feedbacks
├── routers/
│   ├── auth.js              # Rotas de autenticação
│   ├── user.js              # Rotas de usuários
│   ├── professor.js         # Rotas de professores
│   ├── discipline.js        # Rotas de disciplinas
│   ├── infrastructure.js    # Rotas de infraestrutura
│   └── feedback.js          # Rotas de feedback
└── server.js                # Arquivo principal
```

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Node.js (v14 ou superior)
- MongoDB (local ou cloud)
- npm ou yarn

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Database
MONGO_URI=mongodb://localhost:27017/unex-escuta

# JWT
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd unex-escuta-api
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente no arquivo `.env`

4. Inicie o servidor:
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```
## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request





