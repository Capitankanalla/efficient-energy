function actualitzarSegment() {
  const potencia = parseFloat(document.getElementById("potencia").value);
  const segment = detectarSegment(potencia);

  document.getElementById("camps-llar").classList.add("ocult");
  document.getElementById("camps-negoci").classList.add("ocult");
  document.getElementById("camps-industria").classList.add("ocult");

  if (segment === "llar") document.getElementById("camps-llar").classList.remove("ocult");
  if (segment === "negoci") document.getElementById("camps-negoci").classList.remove("ocult");
  if (segment === "industria") document.getElementById("camps-industria").classList.remove("ocult");
}

function detectarSegment(p) {
  if (p < 10) return "llar";
  if (p >= 10 && p < 15) return "negoci";
  if (p >= 15 && p <= 150) return "negoci";
  if (p > 150) return "industria";
}

function calcular() {
  const potencia = parseFloat(document.getElementById("potencia").value);
  const segment = detectarSegment(potencia);

  let consumTotal = 0;

  if (segment === "llar") {
    consumTotal = parseFloat(document.getElementById("consum-llar").value);
  }

  if (segment === "negoci") {
    consumTotal =
      (parseFloat(document.getElementById("p1").value) || 0) +
      (parseFloat(document.getElementById("p2").value) || 0) +
      (parseFloat(document.getElementById("p3").value) || 0);
  }

  if (segment === "industria") {
    consumTotal =
      (parseFloat(document.getElementById("i1").value) || 0) +
      (parseFloat(document.getElementById("i2").value) || 0) +
      (parseFloat(document.getElementById("i3").value) || 0) +
      (parseFloat(document.getElementById("i4").value) || 0) +
      (parseFloat(document.getElementById("i5").value) || 0) +
      (parseFloat(document.getElementById("i6").value) || 0);
  }

  const preuActual = parseFloat(document.getElementById("preuActual").value);
  const preuNou = parseFloat(document.getElementById("preuNou").value);

  const costActual = consumTotal * preuActual;
  const costNou = consumTotal * preuNou;
  const estalvi = costActual - costNou;

  document.getElementById("resultat").innerHTML =
    `<h3>Segment: ${segment.toUpperCase()}</h3>
     Estalvi mensual: ${estalvi.toFixed(2)} €<br>
     Estalvi anual: ${(estalvi * 12).toFixed(2)} €`;
}
