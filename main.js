/* ============================================================
   ГеоМетрия Пространства — Main JS v3.0 (Telegram Integration)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ============================================================
  // TELEGRAM BOT CONFIGURATION
  // ============================================================
  const TELEGRAM_BOT_TOKEN = '8835407443:AAFIc1yDMMWMvYvJm_bOO8j_iUEK4Lk2inY'; 
  const TELEGRAM_CHAT_ID = '5042071687'; 

  async function sendTelegramMessage(text) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('Telegram Bot или Chat ID не настроены.');
      return false;
    }
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'HTML'
        })
      });
      return response.ok;
    } catch (e) {
      console.error('Ошибка отправки в Telegram:', e);
      return false;
    }
  }

  // Глобальное хранилище данных калькулятора
  window.calcState = null;

  // ============================================================
  // STICKY HEADER with backdrop blur
  // ============================================================
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('header--scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  // ============================================================
  // MOBILE MENU
  // ============================================================
  const burger = document.querySelector('.header__burger');
  const contacts = document.querySelector('.header__contacts');
  if (burger && contacts) {
    burger.addEventListener('click', () => {
      contacts.classList.toggle('open');
      burger.classList.toggle('active');
    });
  }

  // ============================================================
  // QUIZ LOGIC
  // ============================================================
  const quizWidget = document.querySelector('.quiz__widget');
  if (quizWidget) {
    const steps = quizWidget.querySelectorAll('.quiz__step');
    const progressBar = quizWidget.querySelector('.quiz__progress-bar');
    const totalSteps = steps.length;
    let currentStep = 0;
    const quizData = {
      step_0: 'Не выбрано',
      step_1: 'Не выбрано',
      step_2: 'Не выбрано',
      messenger: 'WhatsApp'
    };

    function showStep(index) {
      steps.forEach((step, i) => step.classList.toggle('active', i === index));
      if (progressBar) progressBar.style.width = ((index + 1) / totalSteps * 100) + '%';
      currentStep = index;
    }

    quizWidget.addEventListener('click', (e) => {
      const option = e.target.closest('.quiz__option');
      if (option) {
        const step = option.closest('.quiz__step');
        step.querySelectorAll('.quiz__option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        quizData[`step_${Array.from(steps).indexOf(step)}`] = option.querySelector('span:last-child')?.textContent.trim();
      }

      const messengerBtn = e.target.closest('.quiz__messenger-btn');
      if (messengerBtn) {
        quizWidget.querySelectorAll('.quiz__messenger-btn').forEach(b => b.classList.remove('selected'));
        messengerBtn.classList.add('selected');
        quizData.messenger = messengerBtn.dataset.messenger === 'whatsapp' ? 'WhatsApp' : 'Telegram';
      }

      const nextBtn = e.target.closest('.quiz__nav-next');
      if (nextBtn && currentStep < totalSteps - 1) showStep(currentStep + 1);

      const backBtn = e.target.closest('.quiz__nav-back');
      if (backBtn && currentStep > 0) showStep(currentStep - 1);
    });

    const quizSubmit = quizWidget.querySelector('.quiz__submit');
    if (quizSubmit) {
      quizSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        const phoneInput = quizWidget.querySelector('.quiz__phone-input');
        if (phoneInput && phoneInput.value.replace(/\D/g, '').length >= 11) {
          quizData.phone = phoneInput.value;
          
          const messageText = `🔔 <b>Новая заявка с КВИЗа!</b>\n\n` +
            `• <b>Тип работ:</b> ${quizData.step_0}\n` +
            `• <b>Объём:</b> ${quizData.step_1}\n` +
            `• <b>Сроки:</b> ${quizData.step_2}\n` +
            `• <b>Связь:</b> ${quizData.messenger}\n` +
            `• <b>Телефон:</b> <code>${quizData.phone}</code>`;
            
          quizSubmit.disabled = true;
          quizSubmit.textContent = 'Отправка...';
          await sendTelegramMessage(messageText);
          window.location.href = 'thanks.html';
        } else if (phoneInput) {
          shakeElement(phoneInput);
          phoneInput.style.borderColor = '#e53e3e';
          phoneInput.focus();
          setTimeout(() => { phoneInput.style.borderColor = ''; }, 2000);
        }
      });
    }
    showStep(0);
  }

  // ============================================================
  // CALCULATOR LOGIC
  // ============================================================
  const calcWidget = document.querySelector('.calculator__widget');
  if (calcWidget) {
    const pricing = {
      paving:    { name: 'Тротуарная плитка', work: [900, 1400, 2200], material: [700, 1300, 2800] },
      ceramic:   { name: 'Укладка кафеля',    work: [1100, 1800, 3200], material: [900, 2000, 4500] },
      blindarea: { name: 'Отмостка',           work: [1600, 2400, 3800], material: [600, 1100, 2200] },
      drainage:  { name: 'Дренаж (пог.м)',     work: [1800, 2800, 4500], material: [1000, 1600, 3000] },
      renovation:{ name: 'Ремонт под ключ',    work: [4000, 7000, 12000], material: [2500, 5500, 11000] },
      parking:   { name: 'Парковочная зона',   work: [1200, 1800, 2800], material: [800, 1500, 3200] },
    };

    let selectedTypes = [];
    let area = 50;
    let level = 1; 
    let withMaterials = true;

    const typeCards = calcWidget.querySelectorAll('.calc__type');
    typeCards.forEach(card => {
      card.addEventListener('click', () => {
        card.classList.toggle('selected');
        const type = card.dataset.type;
        if (selectedTypes.includes(type)) {
          selectedTypes = selectedTypes.filter(t => t !== type);
        } else {
          selectedTypes.push(type);
        }
        updateCalc();
      });
    });

    const areaInput = calcWidget.querySelector('.calc__area-input');
    const areaSlider = calcWidget.querySelector('.calc__area-slider');
    if (areaInput && areaSlider) {
      areaSlider.addEventListener('input', () => {
        area = parseInt(areaSlider.value);
        areaInput.value = area;
        updateSliderBg();
        updateCalc();
      });
      areaInput.addEventListener('input', () => {
        let val = parseInt(areaInput.value) || 0;
        if (val > 1000) val = 1000;
        area = val;
        areaSlider.value = val;
        updateSliderBg();
        updateCalc();
      });
      function updateSliderBg() {
        const pct = ((area - 5) / (1000 - 5)) * 100;
        areaSlider.style.background = `linear-gradient(to right, var(--accent-orange) ${pct}%, rgba(36,38,40,0.08) ${pct}%)`;
      }
      updateSliderBg();
    }

    const levelCards = calcWidget.querySelectorAll('.calc__level');
    levelCards.forEach(card => {
      card.addEventListener('click', () => {
        levelCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        level = parseInt(card.dataset.level);
        updateCalc();
      });
    });

    const toggleBtns = calcWidget.querySelectorAll('.calc__toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        withMaterials = btn.dataset.toggle === 'with';
        updateCalc();
      });
    });

    function updateCalc() {
      let workTotal = 0;
      let materialTotal = 0;

      selectedTypes.forEach(type => {
        if (pricing[type]) {
          workTotal += pricing[type].work[level] * area;
          if (withMaterials) {
            materialTotal += pricing[type].material[level] * area;
          }
        }
      });

      const total = workTotal + materialTotal;
      const discounted = Math.round(total * 0.85);

      animateCounter(calcWidget.querySelector('.calc__result-work'), workTotal);
      animateCounter(calcWidget.querySelector('.calc__result-material'), materialTotal);
      animateCounter(calcWidget.querySelector('.calc__result-total'), total);

      const discountEl = calcWidget.querySelector('.calc__result-discount');
      if (discountEl) {
        if (total > 0) {
          discountEl.textContent = `Со скидкой 15%: ${formatNumber(discounted)} ₽`;
          discountEl.classList.add('visible');
        } else {
          discountEl.classList.remove('visible');
        }
      }

      window.calcState = {
        selectedWorkNames: selectedTypes.map(t => pricing[t]?.name || t),
        area: area,
        materialsLevel: level === 0 ? 'Эконом' : (level === 1 ? 'Стандарт' : 'Премиум'),
        withMaterials: withMaterials ? 'Да' : 'Нет',
        workTotal: workTotal,
        materialTotal: materialTotal,
        total: total,
        discounted: discounted
      };
    }

    function animateCounter(el, target) {
      if (!el) return;
      const current = parseInt(el.textContent.replace(/\D/g, '')) || 0;
      const diff = target - current;
      const duration = 600;
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); 
        const value = Math.round(current + diff * eased);
        el.textContent = formatNumber(value) + ' ₽';
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function formatNumber(n) {
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    updateCalc();
  }

  // ============================================================
  // SERVICE TABS
  // ============================================================
  const tabsContainer = document.querySelector('.services__tabs');
  if (tabsContainer) {
    const tabs = tabsContainer.querySelectorAll('.services__tab');
    const contents = document.querySelectorAll('.services__content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        contents.forEach(c => {
          c.classList.remove('active');
          if (c.dataset.tab === target) c.classList.add('active');
        });
      });
    });
  }

  // ============================================================
  // PORTFOLIO SLIDER
  // ============================================================
  const slider = document.querySelector('.portfolio__slider');
  if (slider) {
    const track = slider.querySelector('.portfolio__track');
    const slides = slider.querySelectorAll('.portfolio__slide');
    const prevBtn = document.querySelector('.portfolio__arrow--prev');
    const nextBtn = document.querySelector('.portfolio__arrow--next');
    const dots = document.querySelectorAll('.portfolio__dot');
    let currentSlide = 0;
    const totalSlides = slides.length;

    function goToSlide(index) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      currentSlide = index;
      track.style.transform = `translateX(-${currentSlide * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));

    let touchStartX = 0;
    if (track) {
      track.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
      track.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
      }, { passive: true });
    }

    setInterval(() => goToSlide(currentSlide + 1), 6000);
  }

  // ============================================================
  // PHONE INPUT MASK
  // ============================================================
  function applyPhoneMask(input) {
    if (!input) return;
    input.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (!v.length) { e.target.value = ''; return; }
      if (v[0] === '8') v = '7' + v.slice(1);
      if (v[0] !== '7') v = '7' + v;
      let f = '+7';
      if (v.length > 1) f += ' (' + v.slice(1, 4);
      if (v.length >= 4) f += ') ';
      if (v.length > 4) f += v.slice(4, 7);
      if (v.length > 7) f += '-' + v.slice(7, 9);
      if (v.length > 9) f += '-' + v.slice(9, 11);
      e.target.value = f;
    });
    input.addEventListener('focus', () => { if (!input.value) input.value = '+7 ('; });
    input.addEventListener('blur', () => { if (input.value === '+7 (' || input.value === '+7') input.value = ''; });
    input.addEventListener('keydown', (e) => {
      if (!['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key) && (e.key < '0' || e.key > '9')) e.preventDefault();
    });
  }
  document.querySelectorAll('[data-phone-mask]').forEach(applyPhoneMask);

  // ============================================================
  // FORM SUBMISSIONS (Showroom and Footer Forms)
  // ============================================================
  document.querySelectorAll('[data-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phoneInput = form.querySelector('input[type="tel"]');
      const submitBtn = form.querySelector('button[type="submit"]');
      
      if (phoneInput && phoneInput.value.replace(/\D/g, '').length >= 11) {
        const phone = phoneInput.value;
        const formId = form.id;
        let messageText = '';

        if (formId === 'showroom-form') {
          messageText = `🔔 <b>Новая заявка: Мобильный Шоу-рум</b>\n\n` +
            `• <b>Услуга:</b> Бесплатный выезд с образцами плитки\n` +
            `• <b>Телефон:</b> <code>${phone}</code>`;
        } else {
          // Footer form (check if calculator was used)
          messageText = `🔔 <b>Новая заявка: Консультация</b>\n\n` +
            `• <b>Услуга:</b> Личная консультация руководителя\n` +
            `• <b>Телефон:</b> <code>${phone}</code>`;

          if (window.calcState && window.calcState.total > 0) {
            const works = window.calcState.selectedWorkNames.join(', ');
            messageText += `\n\n📊 <b>Расчет на калькуляторе:</b>\n` +
              `• <b>Работы:</b> ${works}\n` +
              `• <b>Площадь:</b> ${window.calcState.area} м²\n` +
              `• <b>Материалы:</b> ${window.calcState.materialsLevel} (С материалами: ${window.calcState.withMaterials})\n` +
              `• <b>Работа:</b> ${window.calcState.workTotal.toLocaleString()} ₽\n` +
              `• <b>Материалы:</b> ${window.calcState.materialTotal.toLocaleString()} ₽\n` +
              `• <b>Итого:</b> <u>${window.calcState.total.toLocaleString()} ₽</u>\n` +
              `• <b>Цена со скидкой 15%:</b> <u>${window.calcState.discounted.toLocaleString()} ₽</u>`;
          }
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Отправка...';
        }

        await sendTelegramMessage(messageText);
        window.location.href = 'thanks.html';
      } else if (phoneInput) {
        shakeElement(phoneInput);
        phoneInput.style.borderColor = '#e53e3e';
        phoneInput.focus();
        setTimeout(() => { phoneInput.style.borderColor = ''; }, 2000);
      }
    });
  });

  // ============================================================
  // SCROLL REVEAL ANIMATIONS (Enhanced)
  // ============================================================
  const revealSelectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children';
  const revealEls = document.querySelectorAll(revealSelectors);
  if (revealEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealEls.forEach(el => observer.observe(el));
  }

  // ============================================================
  // PARALLAX on scroll
  // ============================================================
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length > 0) {
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.3;
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + scrollY - window.innerHeight / 2) * speed;
        el.style.transform = `translateY(${offset * -0.1}px)`;
      });
    }, { passive: true });
  }

  // ============================================================
  // SMOOTH SCROLL
  // ============================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const headerH = document.querySelector('.header')?.offsetHeight || 0;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerH, behavior: 'smooth' });
      }
    });
  });

  // ============================================================
  // SHAKE ANIMATION (for form validation)
  // ============================================================
  function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; 
    el.style.animation = 'shake 0.5s ease';
    setTimeout(() => { el.style.animation = ''; }, 500);
  }

  if (!document.querySelector('#shake-style')) {
    const style = document.createElement('style');
    style.id = 'shake-style';
    style.textContent = `@keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }`;
    document.head.appendChild(style);
  }

  // ============================================================
  // MAGNETIC CARD EFFECT
  // ============================================================
  document.querySelectorAll('.magnetic-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width * 8;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height * 8;
      card.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

});
