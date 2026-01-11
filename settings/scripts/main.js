// js/main.js
document.addEventListener('DOMContentLoaded', function() {
    // Текущие данные
    let allCourses = [];
    let allTutors = [];
    let currentCoursePage = 1;
    const coursesPerPage = 5;
    let selectedCourse = null;
    let selectedTutor = null;
    
    // Инициализация
    init();
    
    async function init() {
        try {
            // Загрузка курсов
            await loadCourses();
            
            // Загрузка репетиторов
            await loadTutors();
            
            // Настройка обработчиков событий
            setupEventListeners();
            
            // Настройка минимальной даты для формы репетитора
            setupDateRestrictions();
            
        } catch (error) {
            console.error('Initialization error:', error);
            api.showNotification('Ошибка загрузки данных', 'danger');
        }
    }
    
    async function loadCourses() {
        try {
            allCourses = await api.fetchCourses();
            renderCourses();
            setupCourseSearch();
        } catch (error) {
            console.error('Error loading courses:', error);
            document.getElementById('courses-container').innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Ошибка загрузки курсов. Попробуйте обновить страницу.
                    </div>
                </div>
            `;
        }
    }
    
    async function loadTutors() {
        try {
            allTutors = await api.fetchTutors();
            renderTutors();
            setupTutorSearch();
            populateTutorSelect();
            populateLanguageOptions();
        } catch (error) {
            console.error('Error loading tutors:', error);
            document.getElementById('tutors-body').innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            Ошибка загрузки репетиторов. Попробуйте обновить страницу.
                        </div>
                    </td>
                </tr>
            `;
        }
    }
    
    function renderCourses() {
        const container = document.getElementById('courses-container');
        if (!container) return;
        
        const filteredCourses = filterCourses();
        const paginatedCourses = api.paginate(filteredCourses, currentCoursePage, coursesPerPage);
        
        container.innerHTML = '';
        
        if (paginatedCourses.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="bg-light p-4 rounded-3">
                        <i class="bi bi-book display-1 text-muted mb-3"></i>
                        <h4 class="text-muted">Курсы не найдены</h4>
                        <p class="text-muted">Попробуйте изменить параметры поиска</p>
                        <button class="btn btn-primary mt-3" onclick="resetCourseSearch()">
                            <i class="bi bi-arrow-counterclockwise me-2"></i>Сбросить поиск
                        </button>
                    </div>
                </div>
            `;
            renderPagination(0);
            return;
        }
        
        paginatedCourses.forEach((course, index) => {
            const courseCard = createCourseCard(course, index);
            container.appendChild(courseCard);
        });
        
        renderPagination(filteredCourses.length);
    }
    
    function createCourseCard(course, index) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 fade-in-up';
        col.style.animationDelay = `${index * 0.1}s`;
        
        const totalHours = course.total_length * course.week_length;
        
        // Создаем уникальный ID для каждого курса
        const cardId = `course-${course.id}`;
        
        col.innerHTML = `
            <div class="card h-100 shadow-sm border-0">
                <div class="card-body d-flex flex-column">
                    <div class="mb-3">
                        <span class="badge bg-primary mb-2">${getLevelName(course.level)}</span>
                        <h5 class="card-title">${course.name}</h5>
                        <p class="card-text text-muted" style="height: 60px; overflow: hidden; text-overflow: ellipsis;">
                            ${course.description}
                        </p>
                    </div>
                    <div class="mt-auto">
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <small class="text-muted">Преподаватель</small>
                                <div class="fw-semibold">${course.teacher}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Длительность</small>
                                <div class="fw-semibold">${course.total_length} недель</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Часов в неделю</small>
                                <div class="fw-semibold">${course.week_length}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Ставка за час</small>
                                <div class="fw-semibold">${course.course_fee_per_hour} руб</div>
                            </div>
                        </div>
                        <button class="btn btn-primary w-100 apply-course-btn" data-course-id="${course.id}" id="${cardId}-btn">
                            <i class="bi bi-file-earmark-text me-2"></i>Подать заявку
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем обработчик для кнопки заявки
        col.querySelector('.apply-course-btn').addEventListener('click', () => {
            openCourseApplication(course);
        });
        
        return col;
    }
    
    function getLevelName(level) {
        const levels = {
            'Beginner': 'Начальный',
            'Intermediate': 'Средний',
            'Advanced': 'Продвинутый'
        };
        return levels[level] || level;
    }
    
    function renderPagination(totalItems) {
        const pagination = document.getElementById('courses-pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(totalItems / coursesPerPage);
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = `
            <ul class="pagination">
                <li class="page-item ${currentCoursePage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev">
                        <i class="bi bi-chevron-left"></i> Предыдущая
                    </a>
                </li>
        `;
        
        // Показываем только часть страниц если их много
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentCoursePage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${currentCoursePage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        paginationHTML += `
                <li class="page-item ${currentCoursePage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="next">
                        Следующая <i class="bi bi-chevron-right"></i>
                    </a>
                </li>
            </ul>
        `;
        
        pagination.innerHTML = paginationHTML;
        
        // Добавляем обработчики для пагинации
        pagination.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                
                if (page === 'prev' && currentCoursePage > 1) {
                    currentCoursePage--;
                } else if (page === 'next' && currentCoursePage < totalPages) {
                    currentCoursePage++;
                } else if (!isNaN(page)) {
                    currentCoursePage = parseInt(page);
                }
                
                renderCourses();
                
                // Плавная прокрутка к курсам
                const coursesSection = document.getElementById('courses');
                if (coursesSection) {
                    window.scrollTo({
                        top: coursesSection.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
    
    function filterCourses() {
        const searchName = document.getElementById('course-name')?.value.toLowerCase() || '';
        const searchLevel = document.getElementById('course-level')?.value || '';
        
        return allCourses.filter(course => {
            const nameMatch = !searchName || 
                course.name.toLowerCase().includes(searchName) || 
                course.description.toLowerCase().includes(searchName) ||
                course.teacher.toLowerCase().includes(searchName);
            
            const levelMatch = !searchLevel || course.level === searchLevel;
            
            return nameMatch && levelMatch;
        });
    }
    
    function setupCourseSearch() {
        const searchForm = document.getElementById('course-search-form');
        if (searchForm) {
            searchForm.addEventListener('input', () => {
                currentCoursePage = 1;
                renderCourses();
            });
        }
    }
    
    function resetCourseSearch() {
        document.getElementById('course-name').value = '';
        document.getElementById('course-level').value = '';
        currentCoursePage = 1;
        renderCourses();
    }
    
    function renderTutors() {
        const tbody = document.getElementById('tutors-body');
        if (!tbody) return;
        
        const filteredTutors = filterTutors();
        
        tbody.innerHTML = '';
        
        if (filteredTutors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="bg-light p-4 rounded-3">
                            <i class="bi bi-person-x display-4 text-muted mb-3"></i>
                            <h5 class="text-muted">Репетиторы не найдены</h5>
                            <p class="text-muted">Попробуйте изменить параметры поиска</p>
                            <button class="btn btn-primary mt-3" onclick="resetTutorSearch()">
                                <i class="bi bi-arrow-counterclockwise me-2"></i>Сбросить поиск
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        filteredTutors.forEach((tutor, index) => {
            const row = createTutorRow(tutor, index);
            tbody.appendChild(row);
        });
    }
    
    function createTutorRow(tutor, index) {
        const row = document.createElement('tr');
        row.className = 'fade-in-up';
        row.style.animationDelay = `${index * 0.1}s`;
        
        if (selectedTutor?.id === tutor.id) {
            row.classList.add('selected-tutor');
        }
        
        const languagesOffered = tutor.languages_offered.map(lang => 
            `<span class="badge bg-secondary me-1">${getLanguageName(lang)}</span>`
        ).join('');
        
        const languagesSpoken = tutor.languages_spoken.map(lang => 
            `<span class="badge bg-light text-dark border me-1">${getLanguageName(lang)}</span>`
        ).join('');
        
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=0d6efd&color=fff&size=40" 
                         alt="${tutor.name}" class="rounded-circle me-3">
                    <div>
                        <strong>${tutor.name}</strong>
                        <div class="text-muted small mt-1">${languagesSpoken}</div>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge bg-info">${getLevelName(tutor.language_level)}</span>
            </td>
            <td>
                ${languagesOffered}
            </td>
            <td class="fw-semibold">${tutor.work_experience} лет</td>
            <td class="fw-bold text-primary">${tutor.price_per_hour} руб/час</td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary select-tutor-btn" data-tutor-id="${tutor.id}">
                        <i class="bi bi-check-circle me-1"></i>Выбрать
                    </button>
                    <button class="btn btn-sm btn-primary request-tutor-btn" data-tutor-id="${tutor.id}">
                        <i class="bi bi-chat-left-text me-1"></i>Запросить
                    </button>
                </div>
            </td>
        `;
        
        // Обработчик для кнопки выбора
        row.querySelector('.select-tutor-btn').addEventListener('click', () => {
            selectTutor(tutor);
        });
        
        // Обработчик для кнопки запроса
        row.querySelector('.request-tutor-btn').addEventListener('click', () => {
            openTutorRequest(tutor);
        });
        
        return row;
    }
    
    function getLanguageName(language) {
        const languages = {
            'Chinese': 'Китайский',
            'English': 'Английский',
            'Russian': 'Русский',
            'Spanish': 'Испанский',
            'German': 'Немецкий',
            'French': 'Французский',
            'Japanese': 'Японский',
            'Korean': 'Корейский'
        };
        return languages[language] || language;
    }
    
    function filterTutors() {
        const language = document.getElementById('tutor-language')?.value || '';
        const level = document.getElementById('tutor-level')?.value || '';
        
        return allTutors.filter(tutor => {
            const languageMatch = !language || tutor.languages_offered.includes(language);
            const levelMatch = !level || tutor.language_level === level;
            
            return languageMatch && levelMatch;
        });
    }
    
    function setupTutorSearch() {
        const searchForm = document.getElementById('tutor-search-form');
        if (searchForm) {
            searchForm.addEventListener('input', () => {
                renderTutors();
            });
        }
    }
    
    function resetTutorSearch() {
        document.getElementById('tutor-language').value = '';
        document.getElementById('tutor-level').value = '';
        renderTutors();
    }
    
    function populateLanguageOptions() {
        const languageSelect = document.getElementById('tutor-language');
        if (!languageSelect) return;
        
        // Получаем все уникальные языки из репетиторов
        const allLanguages = new Set();
        allTutors.forEach(tutor => {
            tutor.languages_offered.forEach(lang => allLanguages.add(lang));
        });
        
        // Сортируем языки
        const sortedLanguages = Array.from(allLanguages).sort();
        
        // Добавляем опции
        sortedLanguages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = getLanguageName(lang);
            languageSelect.appendChild(option);
        });
    }
    
    function populateTutorSelect() {
        const select = document.getElementById('request-tutor-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Выберите репетитора</option>';
        
        allTutors.forEach(tutor => {
            const option = document.createElement('option');
            option.value = tutor.id;
            option.textContent = `${tutor.name} - ${getLevelName(tutor.language_level)} (${tutor.price_per_hour} руб/час)`;
            select.appendChild(option);
        });
    }
    
    function selectTutor(tutor) {
        selectedTutor = tutor;
        renderTutors(); // Перерисовываем таблицу для выделения выбранного репетитора
        api.showNotification(`Выбран репетитор: ${tutor.name}`, 'info');
    }
    
    function openCourseApplication(course) {
        selectedCourse = course;
        
        // Заполняем поля формы
        document.getElementById('modal-course-name').value = course.name;
        document.getElementById('modal-course-teacher').value = course.teacher;
        document.getElementById('modal-duration').value = course.total_length;
        document.getElementById('modal-total-hours').value = course.total_length * course.week_length;
        
        // Заполняем даты начала
        const dateSelect = document.getElementById('modal-start-date');
        dateSelect.innerHTML = '<option value="">Выберите дату начала</option>';
        
        // Получаем уникальные даты из start_dates
        const uniqueDates = [...new Set(course.start_dates.map(date => date.split('T')[0]))]
            .sort((a, b) => new Date(a) - new Date(b));
        
        uniqueDates.forEach(dateStr => {
            const date = new Date(dateStr);
            const option = document.createElement('option');
            option.value = dateStr;
            option.textContent = api.formatDate(dateStr);
            dateSelect.appendChild(option);
        });
        
        // Сбрасываем время и стоимость
        document.getElementById('modal-start-time').innerHTML = '<option value="">Сначала выберите дату</option>';
        document.getElementById('modal-start-time').disabled = true;
        document.getElementById('modal-end-date').value = '';
        
        // Сбрасываем дополнительные опции
        ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'].forEach(id => {
            document.getElementById(`modal-${id}`).checked = false;
        });
        
        // Сбрасываем скидки
        document.getElementById('discount-info').style.display = 'none';
        document.getElementById('discount-info').innerHTML = '';
        
        // Сбрасываем стоимость
        document.getElementById('modal-total-price').textContent = '0 руб';
        
        // Показываем модальное окно
        const modal = new bootstrap.Modal(document.getElementById('applyModal'));
        modal.show();
        
        // Устанавливаем фокус на дату
        setTimeout(() => {
            dateSelect.focus();
        }, 300);
    }
    
    function setupEventListeners() {
        // Обработчик изменения даты в форме курса
        document.getElementById('modal-start-date')?.addEventListener('change', function() {
            const timeSelect = document.getElementById('modal-start-time');
            const date = this.value;
            
            if (!date || !selectedCourse) {
                timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
                timeSelect.disabled = true;
                document.getElementById('modal-end-date').value = '';
                calculateTotalPrice();
                return;
            }
            
            timeSelect.innerHTML = '<option value="">Выберите время начала</option>';
            
            // Фильтруем времена для выбранной даты
            const timesForDate = selectedCourse.start_dates
                .filter(dt => dt.startsWith(date))
                .map(dt => {
                    const timePart = dt.split('T')[1].substring(0, 5);
                    return timePart;
                })
                .sort();
            
            // Убираем дубликаты времени
            const uniqueTimes = [...new Set(timesForDate)];
            
            uniqueTimes.forEach(time => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeSelect.appendChild(option);
            });
            
            timeSelect.disabled = false;
            
            // Рассчитываем дату окончания
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + (selectedCourse.total_length * 7));
            document.getElementById('modal-end-date').value = api.formatDate(endDate.toISOString());
            
            calculateTotalPrice();
            
            // Устанавливаем фокус на время
            setTimeout(() => {
                timeSelect.focus();
            }, 100);
        });
        
        // Обработчик изменения времени
        document.getElementById('modal-start-time')?.addEventListener('change', calculateTotalPrice);
        
        // Обработчики изменения количества студентов и опций
        document.getElementById('modal-students')?.addEventListener('input', calculateTotalPrice);
        
        ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'].forEach(id => {
            document.getElementById(`modal-${id}`)?.addEventListener('change', calculateTotalPrice);
        });
        
        // Обработчик отправки заявки на курс
        document.getElementById('submit-application')?.addEventListener('click', submitCourseApplication);
        
        // Обработчик отправки заявки на репетитора
        document.getElementById('submit-tutor-request')?.addEventListener('click', submitTutorRequest);
        
        // Обработчик для карты
        document.getElementById('map-search-btn')?.addEventListener('click', function() {
            const query = document.getElementById('map-search').value;
            if (query) {
                window.map?.geocode(query);
            }
        });
        
        document.getElementById('map-search')?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('map-search-btn').click();
            }
        });
        
        // Обработчики фильтров карты
        document.querySelectorAll('#map-filters input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (window.map) {
                    window.map.updateFilters();
                }
            });
        });
        
        // Обработчики скролла для анимаций
        setupScrollAnimations();
    }
    
    function setupDateRestrictions() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateInputs = [
            document.getElementById('request-date'),
            document.getElementById('edit-date-start')
        ];
        
        dateInputs.forEach(input => {
            if (input) {
                input.min = tomorrow.toISOString().split('T')[0];
            }
        });
    }
    
    function calculateTotalPrice() {
        if (!selectedCourse) return;
        
        const course = selectedCourse;
        const students = parseInt(document.getElementById('modal-students').value) || 1;
        const startDate = document.getElementById('modal-start-date').value;
        const startTime = document.getElementById('modal-start-time').value;
        
        // Проверяем, выбраны ли дата и время
        if (!startDate || !startTime) {
            document.getElementById('modal-total-price').textContent = '0 руб';
            return;
        }
        
        // Базовые параметры
        const courseFeePerHour = course.course_fee_per_hour;
        const totalHours = course.total_length * course.week_length;
        
        // Множитель для выходных/праздников
        let isWeekendOrHoliday = 1;
        if (startDate) {
            const date = new Date(startDate);
            const dayOfWeek = date.getDay(); // 0 - воскресенье, 6 - суббота
            
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                isWeekendOrHoliday = 1.5;
            }
        }
        
        // Доплаты за утро/вечер
        let morningSurcharge = 0;
        let eveningSurcharge = 0;
        
        if (startTime) {
            const hour = parseInt(startTime.split(':')[0]);
            
            if (hour >= 9 && hour < 12) {
                morningSurcharge = 400;
            } else if (hour >= 18 && hour < 20) {
                eveningSurcharge = 1000;
            }
        }
        
        // Базовая стоимость
        let totalPrice = ((courseFeePerHour * totalHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge) * students;
        
        // Дополнительные опции
        const supplementary = document.getElementById('modal-supplementary').checked;
        const personalized = document.getElementById('modal-personalized').checked;
        const excursions = document.getElementById('modal-excursions').checked;
        const assessment = document.getElementById('modal-assessment').checked;
        const interactive = document.getElementById('modal-interactive').checked;
        
        let appliedOptions = [];
        
        if (supplementary) {
            totalPrice += 2000 * students;
            appliedOptions.push({name: 'Дополнительные учебные материалы', value: `+2000 руб/студент`});
        }
        
        if (personalized) {
            totalPrice += 1500 * course.total_length;
            appliedOptions.push({name: 'Индивидуальные занятия', value: `+1500 руб/неделя`});
        }
        
        if (excursions) {
            totalPrice *= 1.25;
            appliedOptions.push({name: 'Культурные экскурсии', value: '+25%'});
        }
        
        if (assessment) {
            totalPrice += 300;
            appliedOptions.push({name: 'Оценка уровня владения языка', value: '+300 руб'});
        }
        
        if (interactive) {
            totalPrice *= 1.5;
            appliedOptions.push({name: 'Доступ к интерактивной онлайн-платформе', value: '+50%'});
        }
        
        // Автоматические скидки
        const discountInfo = document.getElementById('discount-info');
        let discounts = [];
        let surcharges = [];
        
        // Скидка за раннюю регистрацию
        if (startDate) {
            const today = new Date();
            const courseStart = new Date(startDate);
            const daysDiff = Math.floor((courseStart - today) / (1000 * 60 * 60 * 24));
            
            if (daysDiff >= 30) {
                const discountAmount = totalPrice * 0.1;
                totalPrice *= 0.9;
                discounts.push({name: 'Скидка за раннюю регистрацию', value: '-10%'});
            }
        }
        
        // Скидка за групповую запись
        if (students >= 5) {
            const discountAmount = totalPrice * 0.15;
            totalPrice *= 0.85;
            discounts.push({name: 'Скидка за групповую запись', value: '-15%'});
        }
        
        // Наценка за интенсивный курс
        if (course.week_length >= 5) {
            const surchargeAmount = totalPrice * 0.2;
            totalPrice *= 1.2;
            surcharges.push({name: 'Интенсивный курс', value: '+20%'});
        }
        
        // Обновляем информацию о скидках
        if (discounts.length > 0 || surcharges.length > 0 || appliedOptions.length > 0) {
            let html = '<div class="fw-bold mb-2">Примененные скидки/наценки:</div><div class="row g-2">';
            
            // Скидки
            discounts.forEach(discount => {
                html += `
                    <div class="col-12 col-md-6">
                        <span class="discount-badge badge-discount">
                            <i class="bi bi-percent"></i> ${discount.name}: ${discount.value}
                        </span>
                    </div>
                `;
            });
            
            // Наценки
            surcharges.forEach(surcharge => {
                html += `
                    <div class="col-12 col-md-6">
                        <span class="discount-badge badge-surcharge">
                            <i class="bi bi-plus-circle"></i> ${surcharge.name}: ${surcharge.value}
                        </span>
                    </div>
                `;
            });
            
            // Дополнительные опции
            appliedOptions.forEach(option => {
                html += `
                    <div class="col-12 col-md-6">
                        <span class="discount-badge badge-info">
                            <i class="bi bi-check-circle"></i> ${option.name}: ${option.value}
                        </span>
                    </div>
                `;
            });
            
            html += '</div>';
            
            discountInfo.innerHTML = html;
            discountInfo.classList.remove('d-none');
        } else {
            discountInfo.classList.add('d-none');
            discountInfo.innerHTML = '';
        }
        
        // Отображаем итоговую стоимость
        document.getElementById('modal-total-price').textContent = Math.round(totalPrice) + ' руб';
    }
    
    async function submitCourseApplication() {
        try {
            const course = selectedCourse;
            if (!course) {
                api.showNotification('Пожалуйста, выберите курс', 'warning');
                return;
            }
            
            // Собираем данные формы
            const startDate = document.getElementById('modal-start-date').value;
            const startTime = document.getElementById('modal-start-time').value;
            const students = parseInt(document.getElementById('modal-students').value) || 1;
            
            if (!startDate || !startTime) {
                api.showNotification('Заполните дату и время начала курса', 'warning');
                return;
            }
            
            // Рассчитываем общую продолжительность в часах
            const duration = course.total_length * course.week_length;
            
            // Рассчитываем скидки для отправки на сервер
            const today = new Date();
            const courseStart = new Date(startDate);
            const daysDiff = Math.floor((courseStart - today) / (1000 * 60 * 60 * 24));
            
            // Собираем данные заявки
            const orderData = {
                course_id: course.id,
                tutor_id: 0, // Для курсов tutor_id = 0
                date_start: startDate,
                time_start: startTime,
                duration: duration,
                persons: students,
                price: parseInt(document.getElementById('modal-total-price').textContent),
                early_registration: daysDiff >= 30,
                group_enrollment: students >= 5,
                intensive_course: course.week_length >= 5,
                supplementary: document.getElementById('modal-supplementary').checked,
                personalized: document.getElementById('modal-personalized').checked,
                excursions: document.getElementById('modal-excursions').checked,
                assessment: document.getElementById('modal-assessment').checked,
                interactive: document.getElementById('modal-interactive').checked,
                student_id: 1 // В реальном приложении это будет браться из авторизации
            };
            
            // Показываем индикатор загрузки
            const submitBtn = document.getElementById('submit-application');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Отправка...';
            
            // Отправляем заявку
            const result = await api.createOrder(orderData);
            
            // Закрываем модальное окно
            bootstrap.Modal.getInstance(document.getElementById('applyModal')).hide();
            
            // Показываем уведомление
            api.showNotification('Заявка успешно отправлена! Переходите в Личный кабинет для просмотра.', 'success');
            
            // Сбрасываем форму
            selectedCourse = null;
            
        } catch (error) {
            console.error('Error submitting course application:', error);
            api.showNotification(`Ошибка при отправке заявки: ${error.message}`, 'danger');
        } finally {
            // Восстанавливаем кнопку
            const submitBtn = document.getElementById('submit-application');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
    
    function openTutorRequest(tutor = null) {
        const modal = new bootstrap.Modal(document.getElementById('tutorRequestModal'));
        
        if (tutor) {
            document.getElementById('request-tutor-select').value = tutor.id;
        } else {
            document.getElementById('request-tutor-select').value = '';
        }
        
        // Сбрасываем форму
        document.getElementById('tutor-request-form').reset();
        
        // Устанавливаем минимальную дату на завтра
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('request-date').min = tomorrow.toISOString().split('T')[0];
        
        modal.show();
    }
    
    async function submitTutorRequest() {
        try {
            const tutorId = parseInt(document.getElementById('request-tutor-select').value);
            const date = document.getElementById('request-date').value;
            const time = document.getElementById('request-time').value;
            const duration = parseInt(document.getElementById('request-duration').value) || 1;
            const persons = parseInt(document.getElementById('request-persons').value) || 1;
            
            if (!tutorId || !date || !time) {
                api.showNotification('Заполните все обязательные поля', 'warning');
                return;
            }
            
            // Находим репетитора
            const tutor = allTutors.find(t => t.id === tutorId);
            if (!tutor) {
                api.showNotification('Репетитор не найден', 'error');
                return;
            }
            
            // Рассчитываем стоимость
            const totalPrice = tutor.price_per_hour * duration * persons;
            
            // Показываем индикатор загрузки
            const submitBtn = document.getElementById('submit-tutor-request');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Отправка...';
            
            // Собираем данные заявки
            const orderData = {
                tutor_id: tutorId,
                course_id: 0, // Для репетиторов course_id = 0
                date_start: date,
                time_start: time,
                duration: duration,
                persons: persons,
                price: totalPrice,
                early_registration: false,
                group_enrollment: false,
                intensive_course: false,
                supplementary: false,
                personalized: false,
                excursions: false,
                assessment: false,
                interactive: false,
                student_id: 1 // В реальном приложении это будет браться из авторизации
            };
            
            // Отправляем заявку
            const result = await api.createOrder(orderData);
            
            // Закрываем модальное окно
            bootstrap.Modal.getInstance(document.getElementById('tutorRequestModal')).hide();
            
            // Показываем уведомление
            api.showNotification('Запрос на занятие с репетитором успешно отправлен!', 'success');
            
            // Сбрасываем форму
            document.getElementById('tutor-request-form').reset();
            
        } catch (error) {
            console.error('Error submitting tutor request:', error);
            api.showNotification(`Ошибка при отправке запроса: ${error.message}`, 'danger');
        } finally {
            // Восстанавливаем кнопку
            const submitBtn = document.getElementById('submit-tutor-request');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
    
    function setupScrollAnimations() {
        const animateOnScroll = () => {
            const elements = document.querySelectorAll('.scroll-animation');
            elements.forEach(element => {
                const elementPosition = element.getBoundingClientRect().top;
                const screenPosition = window.innerHeight / 1.3;
                
                if (elementPosition < screenPosition) {
                    element.classList.add('visible');
                }
            });
        };
        
        // Запускаем при загрузке
        animateOnScroll();
        
        // Запускаем при скролле
        window.addEventListener('scroll', animateOnScroll);
    }
});
