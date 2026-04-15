const express = require('express');
const app = express();
const PORT = 3000;

// Servir tot el directori actual com a estàtic
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Servidor escoltant a http://localhost:${PORT}`);
});