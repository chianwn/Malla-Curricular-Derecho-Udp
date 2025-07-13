function verificarDesbloqueos() {
  const cursos = document.querySelectorAll('.curso');

  const aprobados = Array.from(cursos)
    .filter(c => c.classList.contains('aprobado'))
    .map(c => c.id);

  cursos.forEach(curso => {
    const req = curso.dataset.requisitos;
    if (!req || req.trim() === "") {
      curso.classList.remove("bloqueado");
      return;
    }

    const requisitos = req.split(',').map(r => r.trim());
    const cumple = requisitos.every(r => aprobados.includes(r));

    if (cumple) {
      curso.classList.remove("bloqueado");
    } else {
      curso.classList.add("bloqueado");
    }
  });
}

function marcarCurso(cursoDiv) {
  cursoDiv.classList.toggle("aprobado");
  verificarDesbloqueos();
  calcularCreditos();
  guardarEstado();
}

function calcularCreditos() {
  document.querySelectorAll('.semestre').forEach(semestre => {
    let total = 0;
    const cursosEnSemestre = semestre.querySelectorAll('.curso');

    cursosEnSemestre.forEach(curso => {
      const creditos = parseInt(curso.dataset.creditos) || 0;
      total += creditos;
    });

    const infoDiv = semestre.querySelector('.credito-info');
    if (infoDiv) {
      const actuales = infoDiv.querySelector('.actuales');
      const maximos = infoDiv.querySelector('.maximos');

      actuales.textContent = `Créditos actuales: ${total}`;
      maximos.textContent = `Máximo permitido: 32`;

      actuales.className = 'actuales';

      if (total > 32) {
        actuales.classList.add('excedido'); 
      }

    }
  });
}


function actualizarNombre(input) {
  const cursoDiv = input.closest('.curso');
  const h3 = cursoDiv.querySelector('h3');
  if (input.value.trim() !== '') {
    h3.textContent = input.value;
  }
  cursoDiv.dataset.nombre = input.value;
  guardarEstado();
}

function actualizarCreditos(input) {
  const cursoDiv = input.closest('.curso');
  const p = cursoDiv.querySelector('p');
  const creditos = parseInt(input.value) || 0;
  
  if (creditos > 0) {
    p.textContent = `${creditos} créditos`;
    cursoDiv.dataset.creditos = creditos;
  } else {
    cursoDiv.dataset.creditos = 0;
  }
  
  calcularCreditos();
  guardarEstado();
}

function guardarEstado() {
  const estado = {
    cursosAprobados: [],
    cursosEditables: {}
  };

  document.querySelectorAll('.curso').forEach(curso => {
    if (curso.classList.contains('aprobado')) {
      estado.cursosAprobados.push(curso.id);
    }
    
    if (curso.classList.contains('editable-cfg')) {
      const nombreInput = curso.querySelector('.cfg-nombre');
      const creditosInput = curso.querySelector('.cfg-creditos');
      if (nombreInput && creditosInput) {
        estado.cursosEditables[curso.id] = {
          nombre: nombreInput.value,
          creditos: creditosInput.value
        };
      }
    }
  });

  localStorage.setItem('mallaDerecho', JSON.stringify(estado));
}

function cargarEstado() {
  const estadoGuardado = localStorage.getItem('mallaDerecho');
  if (!estadoGuardado) return;

  try {
    const estado = JSON.parse(estadoGuardado);
    
    estado.cursosAprobados.forEach(cursoId => {
      const curso = document.getElementById(cursoId);
      if (curso) {
        curso.classList.add('aprobado');
      }
    });

    Object.entries(estado.cursosEditables).forEach(([cursoId, datos]) => {
      const curso = document.getElementById(cursoId);
      if (curso && curso.classList.contains('editable-cfg')) {
        const nombreInput = curso.querySelector('.cfg-nombre');
        const creditosInput = curso.querySelector('.cfg-creditos');
        if (nombreInput && creditosInput) {
          nombreInput.value = datos.nombre || '';
          creditosInput.value = datos.creditos || '';
          actualizarNombre(nombreInput);
          actualizarCreditos(creditosInput);
        }
      }
    });

    verificarDesbloqueos();
    calcularCreditos();
  } catch (e) {
    console.error('Error al cargar el estado guardado:', e);
  }
}

function exportarPDF() {
  const doc = new jsPDF();

  
  doc.setFontSize(20);
  doc.text('MALLA DERECHO 6.0 - Progreso Académico', 20, 20);
  
  let yPosition = 40;
  const pageHeight = doc.internal.pageSize.height;
  
  document.querySelectorAll('.semestre').forEach((semestre, index) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    
    const titulo = semestre.querySelector('h2').textContent;
    doc.setFontSize(16);
    doc.text(titulo, 20, yPosition);
    yPosition += 10;
    
    const cursosAprobados = [];
    const cursosPendientes = [];
    
    semestre.querySelectorAll('.curso').forEach(curso => {
      const nombre = curso.querySelector('h3').textContent;

            const cursoInfo = `${nombre} - ${creditos}`; 

      if (curso.classList.contains('aprobado')) {
        cursosAprobados.push(cursoInfo);
      } else {
        cursosPendientes.push(cursoInfo);
      }
    });

    
    if (cursosAprobados.length > 0) {
      doc.setFontSize(12);
      doc.text('Cursos Aprobados:', 25, yPosition);
      yPosition += 5;
      
      cursosAprobados.forEach(curso => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(10);
        doc.text(`✓ ${curso}`, 30, yPosition);
        yPosition += 5;
      });
    }
    
    if (cursosPendientes.length > 0) {
      doc.setFontSize(12);
      doc.text('Cursos Pendientes:', 25, yPosition);
      yPosition += 5;
      
      cursosPendientes.forEach(curso => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(10);
        doc.text(`○ ${curso}`, 30, yPosition);
        yPosition += 5;
      });
    }
    
    const creditoSpan = semestre.querySelector('.credito-info .actuales');
    if (creditoSpan) {
      doc.setFontSize(10);
      doc.text(creditoSpan.textContent, 25, yPosition);
      yPosition += 15;
    }
  });
  
  const fecha = new Date().toLocaleDateString();
  doc.setFontSize(8);
  doc.text(`Generado el: ${fecha}`, 20, pageHeight - 10);
  
  doc.save('malla-derecho-progreso.pdf');
}

function limpiarDatos() {
  if (confirm('¿Estás seguro de que quieres borrar todos los datos guardados? Esta acción no se puede deshacer.')) {
    localStorage.removeItem('mallaDerecho');
    location.reload();
  }
}

window.onload = function () {
  document.querySelectorAll('.semestre').forEach(sem => {
    Sortable.create(sem, {
      animation: 150,
      ghostClass: 'ghost',
      group: 'cursos',
      draggable: '.curso',
      onEnd: function () {
        setTimeout(() => {
          calcularCreditos();  
          guardarEstado();     
        }, 100);
      }
    });
  });

  cargarEstado();
  verificarDesbloqueos();
  calcularCreditos();
};


