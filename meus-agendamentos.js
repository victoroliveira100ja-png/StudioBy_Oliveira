const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAXUSfeCvJY5ZutJOTAPAStEG4wYKQtAag',
  authDomain: 'studio-by-oliveira.firebaseapp.com',
  projectId: 'studio-by-oliveira',
  storageBucket: 'studio-by-oliveira.firebasestorage.app',
  messagingSenderId: '321012575834',
  appId: '1:321012575834:web:d9dc468a7e8e0f0f69f263'
};

firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();

const loginBlock = document.getElementById('loginBlock');
const appBlock = document.getElementById('appBlock');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const forgotButton = document.getElementById('forgotButton');
const welcomeText = document.getElementById('welcomeText');
const resultsArea = document.getElementById('resultsArea');
const logoutButton = document.getElementById('logoutButton');

const escapeHTML = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const formatDate = value => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

const showLoginError = message => {
  loginError.textContent = message;
  loginError.classList.add('visible');
};

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginError.classList.remove('visible');
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Entrando...';

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    showLoginError('E-mail ou senha incorretos. Use os mesmos dados do agendamento.');
  }

  button.disabled = false;
  button.textContent = 'Entrar';
});

forgotButton.addEventListener('click', async () => {
  const email = prompt('Digite o e-mail que você usou no agendamento:');
  if (!email) return;
  try {
    await auth.sendPasswordResetEmail(email);
    alert('Enviamos um link para redefinir sua senha nesse e-mail.');
  } catch (error) {
    alert('Não foi possível enviar o e-mail. Confira se digitou certo.');
  }
});

logoutButton.addEventListener('click', () => auth.signOut());

const renderBookings = bookings => {
  if (!bookings.length) {
    resultsArea.innerHTML = '<p class="lookup-empty">Você ainda não tem nenhum agendamento.</p>';
    return;
  }

  resultsArea.innerHTML = bookings.map(item => `
    <div class="lookup-item">
      <div><strong>${escapeHTML(item.data['serviço'])}</strong><small>${formatDate(item.data.data)} às ${escapeHTML(item.data.tempo)}</small></div>
      <span class="status ${item.data.status === 'Confirmado' ? 'confirmed' : ''}">${escapeHTML(item.data.status)}</span>
      <div class="lookup-actions">
        ${item.data.status !== 'Confirmado' ? `<button class="confirm-btn" data-confirm="${item.id}">Confirmar presença</button>` : ''}
        <button class="cancel-btn" data-cancel="${item.id}">Cancelar agendamento</button>
      </div>
    </div>
  `).join('');
};

const loadBookings = async uid => {
  resultsArea.innerHTML = '<p class="lookup-loading">Carregando...</p>';
  try {
    const snapshot = await db.collection('reservas').where('uid', '==', uid).get();
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    bookings.sort((a, b) => `${a.data.data}${a.data.tempo}`.localeCompare(`${b.data.data}${b.data.tempo}`));
    renderBookings(bookings);
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
    resultsArea.innerHTML = '<p class="lookup-empty">Não foi possível carregar seus agendamentos agora.</p>';
  }
};

resultsArea.addEventListener('click', async event => {
  const confirmId = event.target.dataset.confirm;
  const cancelId = event.target.dataset.cancel;
  const user = auth.currentUser;
  if (!user) return;

  if (confirmId) {
    try {
      await db.collection('reservas').doc(confirmId).update({ status: 'Confirmado' });
      loadBookings(user.uid);
    } catch (error) {
      alert('Não foi possível confirmar. Tente novamente.');
    }
  }

  if (cancelId) {
    if (!confirm('Tem certeza que quer cancelar esse agendamento?')) return;
    try {
      await db.collection('reservas').doc(cancelId).delete();
      loadBookings(user.uid);
    } catch (error) {
      alert('Não foi possível cancelar. Tente novamente.');
    }
  }
});

auth.onAuthStateChanged(user => {
  if (user) {
    loginBlock.hidden = true;
    appBlock.hidden = false;
    welcomeText.textContent = user.email;
    loadBookings(user.uid);
  } else {
    loginBlock.hidden = false;
    appBlock.hidden = true;
  }
});