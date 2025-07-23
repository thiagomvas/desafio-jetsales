# 📌 Desafio Backend — Sistema de Tarefas com Notificações
Este é um desafio de backend que consiste em um sistema de gerenciamento de tarefas com suporte a notificações agendadas usando Redis, BullMQ e um worker dedicado.

## 🧠 Funcionalidades
- Criar, listar e remover tarefas
- Cada tarefa possui título, descrição, data de entrega e usuário associado
- Notificação agendada para 5 minutos antes do horário de entrega
- Worker separado para processar as notificações
- Somente o usuario associado pode ver as tarefas dele

## 🚀 Tecnologias Utilizadas
- Node.js + TypeScript
- Express.js
- Prisma ORM + SQLite
- Redis + BullMQ

### 📦 Instalação
```bash
git clone https://github.com/thiagomvas/desafio-jetsales.git
cd desafio-jetsales
npm install
```
## ⚙️ Configuração
Crie um arquivo .env baseado no .env.example na pasta frontend e backend:

### Backend
```ini
PORT=3000
DATABASE_URL="file:./dev.db"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=sua-chave-secreta
```
### Frontend
```ini
VITE_API_URL=http://localhost:3000
```

## 🔧 Como rodar
Para hospedar, basta compor a aplicação usando Docker Compose
```bash
docker-compose up --build
```

## 🧪 Testes
Para executar os testes, basta entrar na pasta do backend no terminal e executar
```bash
npx jest
```
> [!IMPORTANT]
> É necessário que exista uma instancia do redis executando. Você pode iniciar localmente o servidor ou com docker utilizando `docker run -d --name redis-instance -p 6379:6379 redis:7-alpine`
