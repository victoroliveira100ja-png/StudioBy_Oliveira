const menuButton = document.querySelector('.menu-button');
if (menuButton) {
  const nav = document.querySelector('.topbar nav');
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  }));
  document.getElementById('year').textContent = new Date().getFullYear();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

const dashboard = document.querySelector('.legacy-dashboard-page');
if (dashboard) {
  const defaultServices = [
    { id: 1, name: 'Alongamento', price: 'Consultar', duration: '2h' },
    { id: 2, name: 'Manutenção', price: 'Consultar', duration: '1h30' },
    { id: 3, name: 'Esmaltação', price: 'Consultar', duration: '1h' },
    { id: 4, name: 'Nail art', price: 'Consultar', duration: 'Adicional' }
  ];
  let services = JSON.parse(localStorage.getItem('studioServices')) || defaultServices;
  let bookings = JSON.parse(localStorage.getItem('studioBookings')) || [];
  const save = () => {
    localStorage.setItem('studioServices', JSON.stringify(services));
    localStorage.setItem('studioBookings', JSON.stringify(bookings));
  };
  const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const renderServices = () => {
    document.getElementById('totalServices').textContent = services.length;
    document.getElementById('serviceGrid').innerHTML = services.map(item => `<article class="service-card"><div><h3>${escapeHTML(item.name)}</h3><p>Duração: ${escapeHTML(item.duration)}</p></div><strong>${escapeHTML(item.price)}</strong><button data-delete-service="${item.id}" aria-label="Excluir ${escapeHTML(item.name)}">Excluir</button></article>`).join('');
    document.getElementById('appointmentService').innerHTML = services.map(item => `<option>${escapeHTML(item.name)}</option>`).join('');
  };
  const renderBookings = (term = '') => {
    const filtered = bookings.filter(item => `${item.client} ${item.service}`.toLowerCase().includes(term.toLowerCase()));
    document.getElementById('totalBookings').textContent = bookings.length;
    document.getElementById('confirmedBookings').textContent = bookings.filter(item => item.status === 'Confirmado').length;
    document.getElementById('emptyBookings').hidden = filtered.length > 0;
    document.getElementById('bookingList').innerHTML = filtered.sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).map(item => `<div class="booking-row"><div><strong>${escapeHTML(item.client)}</strong><small>Cliente</small></div><span>${escapeHTML(item.service)}</span><div><strong>${formatDate(item.date)}</strong><small>${escapeHTML(item.time)}</small></div><span class="status ${item.status === 'Confirmado' ? 'confirmed' : ''}">${escapeHTML(item.status)}</span><button class="delete-button" data-delete-booking="${item.id}" aria-label="Excluir horário">×</button></div>`).join('');
  };
  document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item,.view').forEach(el => el.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(`${button.dataset.view}View`).classList.add('active');
  }));
  const appointmentDialog = document.getElementById('appointmentDialog');
  const serviceDialog = document.getElementById('serviceDialog');
  document.getElementById('openAppointment').addEventListener('click', () => appointmentDialog.showModal());
  document.getElementById('openService').addEventListener('click', () => serviceDialog.showModal());
  document.querySelectorAll('.close-dialog,.cancel-button').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.getElementById('appointmentForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    bookings.push({ id: Date.now(), ...data }); save(); renderBookings(); event.currentTarget.reset(); appointmentDialog.close();
  });
  document.getElementById('serviceForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    services.push({ id: Date.now(), ...data }); save(); renderServices(); event.currentTarget.reset(); serviceDialog.close();
  });
  document.getElementById('bookingSearch').addEventListener('input', event => renderBookings(event.target.value));
  document.addEventListener('click', event => {
    const bookingId = event.target.dataset.deleteBooking;
    const serviceId = event.target.dataset.deleteService;
    if (bookingId) { bookings = bookings.filter(item => item.id !== Number(bookingId)); save(); renderBookings(); }
    if (serviceId) { services = services.filter(item => item.id !== Number(serviceId)); save(); renderServices(); }
  });
  renderServices(); renderBookings();
  if (window.location.hash === '#novo-horario') appointmentDialog.showModal();
}

const clientBookingPage = document.querySelector('.dashboard-page');
if (clientBookingPage) {
  const defaultServices = [
    { id: 1, name: 'Alongamento', price: 'Consultar', duration: '2h' },
    { id: 2, name: 'Manutenção', price: 'Consultar', duration: '1h30' },
    { id: 3, name: 'Esmaltação', price: 'Consultar', duration: '1h' },
    { id: 4, name: 'Nail art', price: 'Consultar', duration: 'Adicional' }
  ];

  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyAXUSfeCvJY5ZutJOTAPAStEG4wYKQtAag',
    authDomain: 'studio-by-oliveira.firebaseapp.com',
    projectId: 'studio-by-oliveira',
    storageBucket: 'studio-by-oliveira.firebasestorage.app',
    messagingSenderId: '321012575834',
    appId: '1:321012575834:web:d9dc468a7e8e0f0f69f263'
  };
  const useFirebase = !!(window.firebase && FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.includes('COLOQUE'));
  let db = null;
  let auth = null;
  if (useFirebase) {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    auth = firebase.auth();
  }

  const services = JSON.parse(localStorage.getItem('studioServices')) || defaultServices;
  let bookings = JSON.parse(localStorage.getItem('studioBookings')) || [];
  const availableTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const serviceGrid = document.getElementById('serviceGrid');
  const serviceSelect = document.getElementById('appointmentService');
  const dateInput = document.getElementById('appointmentDate');
  const timeSelect = document.getElementById('appointmentTime');
  const appointmentForm = document.getElementById('appointmentForm');
  const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  serviceGrid.innerHTML = services.map(item => `<article class="service-card"><div><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.duration)}</p></div><strong>${escapeHTML(item.price)}</strong></article>`).join('');
  serviceSelect.innerHTML = services.map(item => `<option value="${escapeHTML(item.name)}">${escapeHTML(item.name)}</option>`).join('');
  dateInput.min = new Date().toISOString().split('T')[0];

  const getBookedTimes = async (selectedDate) => {
    if (!db || !selectedDate) {
      return bookings.filter(item => item.date === selectedDate).map(item => item.time);
    }

    try {
      const snapshot = await db.collection('reservas').where('data', '==', selectedDate).get();
      return snapshot.docs.map(doc => doc.data().tempo);
    } catch (error) {
      console.error('Erro ao consultar reservas:', error);
      return [];
    }
  };

  const renderAvailableTimes = async () => {
    const selectedDate = dateInput.value;
    const bookedTimes = await getBookedTimes(selectedDate);
    const options = availableTimes.filter(time => !bookedTimes.includes(time));

    timeSelect.innerHTML = options.length
      ? `<option value="">Escolha um horário</option>${options.map(time => `<option>${time}</option>`).join('')}`
      : '<option value="">Sem horários nesta data</option>';

    timeSelect.disabled = !selectedDate || !options.length;
  };

  dateInput.addEventListener('change', () => renderAvailableTimes());

  const ensureAccount = async (email, password) => {
    try {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      return credential.user;
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        return credential.user;
      }
      if (error.code === 'auth/wrong-password') {
        throw new Error('Já existe uma conta com esse e-mail, mas a senha não confere. Confirme a senha que você criou antes.');
      }
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Esse e-mail já tem uma conta. Use a senha que você já criou antes.');
      }
      throw error;
    }
  };

  appointmentForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    if (db && auth) {
      let user;
      try {
        user = await ensureAccount(data.email, data.password);
      } catch (error) {
        console.error('Erro de autenticação:', error);
        alert(error.message || 'Não foi possível criar/entrar na sua conta. Verifique e-mail e senha.');
        return;
      }

      try {
        const existing = await db.collection('reservas').where('data', '==', data.date).where('tempo', '==', data.time).get();
        if (!existing.empty) {
          alert('Esse horário já foi reservado por outra pessoa.');
          return;
        }

        await db.collection('reservas').add({
          uid: user.uid,
          cliente: data.client,
          telefone: data.phone,
          telefoneNormalizado: data.phone.replace(/\D/g, ''),
          'serviço': data.service,
          data: data.date,
          tempo: data.time,
          notas: data.notes || '',
          status: 'Aguardando',
          criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (error) {
        console.error('Erro ao salvar no Firestore:', error);
        alert('Não foi possível salvar o agendamento. Tente novamente.');
        return;
      }
    } else {
      bookings.push({ id: Date.now(), status: 'Aguardando', ...data });
      localStorage.setItem('studioBookings', JSON.stringify(bookings));
    }

    const message = [
      'Oi! Gostaria de solicitar um agendamento pelo site.',
      `Nome: ${data.client}`,
      `Serviço: ${data.service}`,
      `Data: ${data.date}`,
      `Horário: ${data.time}`,
      data.notes ? `Observação: ${data.notes}` : ''
    ].filter(Boolean).join('\n');

    window.location.href = `https://wa.me/5511997449453?text=${encodeURIComponent(message)}`;
  });

  renderAvailableTimes();
}
