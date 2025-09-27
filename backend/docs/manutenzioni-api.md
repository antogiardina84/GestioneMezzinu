# API Manutenzioni

## Endpoints

### GET /api/manutenzioni
Recupera lista delle manutenzioni con filtri e paginazione.

**Query Parameters:**
- `page` (number): Numero pagina (default: 1)
- `limit` (number): Elementi per pagina (default: 20)
- `autoveicolo` (string): ID autoveicolo
- `stato` (string): Stato manutenzione
- `tipoManutenzione` (string): Tipo di manutenzione
- `priorita` (string): Priorità
- `dataInizio` (date): Data inizio filtro
- `dataFine` (date): Data fine filtro
- `search` (string): Ricerca testuale

### GET /api/manutenzioni/:id
Recupera una singola manutenzione per ID.

### POST /api/manutenzioni
Crea una nuova manutenzione.

### PUT /api/manutenzioni/:id
Aggiorna una manutenzione esistente.

### DELETE /api/manutenzioni/:id
Elimina una manutenzione.

### POST /api/manutenzioni/:id/allegati
Carica allegati per una manutenzione.

### DELETE /api/manutenzioni/:id/allegati/:allegatoId
Elimina un allegato.

### GET /api/manutenzioni/scadenze
Recupera le scadenze delle manutenzioni.

### GET /api/manutenzioni/statistiche
Recupera statistiche delle manutenzioni.

**Query Parameters:**
- `anno` (number): Anno per le statistiche (default: anno corrente)

## Modelli Dati

### Manutenzione
```json
{
  "_id": "ObjectId",
  "autoveicolo": "ObjectId (ref: Autoveicolo)",
  "tipoManutenzione": "enum",
  "descrizione": "string",
  "dataProgrammata": "Date",
  "dataEsecuzione": "Date",
  "stato": "enum",
  "priorita": "enum",
  "chilometraggioEsecuzione": "number",
  "chilometraggioProgammato": "number",
  "fornitore": {
    "nome": "string",
    "telefono": "string",
    "email": "string",
    "indirizzo": "string",
    "partitaIVA": "string"
  },
  "costi": {
    "manodopera": "number",
    "ricambi": "number",
    "altri": "number",
    "iva": "number"
  },
  "ricambi": [
    {
      "codice": "string",
      "descrizione": "string",
      "quantita": "number",
      "prezzoUnitario": "number"
    }
  ],
  "note": "string",
  "prossimaScadenza": {
    "data": "Date",
    "chilometraggio": "number",
    "descrizione": "string"
  },
  "allegati": [
    {
      "nomeFile": "string",
      "percorsoFile": "string",
      "tipo": "enum",
      "dataCaricamento": "Date"
    }
  ],
  "createdBy": "ObjectId (ref: User)",
  "updatedBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}