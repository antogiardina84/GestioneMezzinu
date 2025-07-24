# Gestione mezzi Domus

Software per la gestione degli automezzi aziendali con monitoraggio di manutenzioni, scadenze e autorizzazioni al trasporto rifiuti.

## Caratteristiche

- Gestione completa autoveicoli aziendali
- Monitoraggio scadenze (revisioni, bolli, assicurazioni)
- Gestione autorizzazioni Albo Nazionale Gestori Ambientali
- Gestione iscrizioni Registro Elettronico Nazionale (REN)
- Dashboard riepilogativa
- Sistema di alert per scadenze
- Upload e gestione allegati
- Autenticazione utenti con crittografia

## Requisiti

- Node.js v16+
- MongoDB v5+
- NPM v8+

## Installazione

1. Clona il repository

```bash
git clone [url-repository]
cd gestione-mezzi-domus
```

2. Installa le dipendenze

```bash
npm install
```

3. Configura le variabili d'ambiente

```bash
cp .env.example .env
```

Modifica il file `.env` con i tuoi valori:

```env
NODE_ENV=development
PORT=5555
MONGODB_URI=mongodb://localhost:28017/gestione_mezzi_domus
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d
```

4. Avvia MongoDB (se non già in esecuzione)

```bash
# Se usi MongoDB come servizio
sudo systemctl start mongod

# Se usi Docker
docker run -d -p 28017:27017 --name mongodb mongo
```

5. Popola il database con dati di esempio

```bash
npm run seed
```

6. Avvia il server

```bash
# Development
npm run dev

# Production
npm start
```

## Utilizzo

### Accesso all'applicazione

- Porta API: `5555`
- Base URL: `http://localhost:5555/api`
- Documentazione API: `/api-docs` (se Swagger è configurato)

### Credenziali di default

Dopo aver eseguito il seed:

- Email: `admin@domus.it`
- Password: `admin123456`

### Endpoints principali

- **Autenticazione**: `/api/auth`
- **Autoveicoli**: `/api/autoveicoli`
- **Albo Gestori**: `/api/albo-gestori`
- **REN**: `/api/ren`
- **Dashboard**: `/api/dashboard`

## Comandi NPM

```bash
# Avvia in modalità sviluppo
npm run dev

# Avvia in produzione
npm start

# Esegui i test
npm test

# Lint del codice
npm run lint

# Formatta il codice
npm run format

# Popola il database
npm run seed
```

## Struttura del progetto

```
gestione-mezzi-domus/
├── config/             # Configurazioni
├── controllers/        # Controller per la logica business
├── models/            # Modelli MongoDB
├── routes/            # Definizione delle route
├── middleware/        # Middleware personalizzati
├── utils/             # Utility e helper
├── uploads/           # File caricati
├── scripts/           # Script di utilità
├── tests/             # Test
├── .env               # Variabili d'ambiente
├── server.js          # Entry point dell'applicazione
└── package.json
```

## Docker

### Uso con Docker Compose

```bash
# Avvia tutti i servizi
docker-compose up -d

# Ferma tutti i servizi
docker-compose down

# Visualizza i log
docker-compose logs -f
```

### Variabili d'ambiente Docker

Le variabili d'ambiente sono configurate nel file `docker-compose.yml`. Modifica secondo necessità.

## API

### Autenticazione

Tutte le API (tranne login e register) richiedono un token JWT nell'header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Esempi di chiamate

```bash
# Login
curl -X POST http://localhost:5555/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@domus.it","password":"admin123456"}'

# Get autoveicoli
curl -X GET http://localhost:5555/api/autoveicoli \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Sicurezza

- Autenticazione JWT
- Crittografia password (bcrypt)
- Rate limiting
- Helmet.js per sicurezza headers
- Validazione input
- Upload file controllati

## Contribuire

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Fai commit delle tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Fai push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## Licenza

Questo progetto è distribuito sotto licenza ISC.

## Sviluppato da

Garden SoftHouse

## Note per la produzione

1. Cambia il `JWT_SECRET` con un valore sicuro
2. Configura backup automatici del database
3. Imposta variabili d'ambiente sicure
4. Configura un reverse proxy (nginx) se necessario
5. Attiva HTTPS
6. Configura il monitoraggio dei log

## Troubleshooting

### MongoDB non si connette

- Verifica che MongoDB sia in esecuzione sulla porta corretta
- Controlla le credenziali in `.env`

### Errori di permessi sui file

```bash
sudo chown -R $USER:$USER uploads/
```

### Port already in use

```bash
# Trova il processo che usa la porta
lsof -i :5555

# Termina il processo
kill -9 [PID]
```
