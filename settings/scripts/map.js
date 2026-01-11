document.addEventListener('DOMContentLoaded', function() {
    // Данные для карты - учебные ресурсы в Москве
    const resources = [
        {
            id: 1,
            name: 'Китайский культурный центр',
            type: 'center',
            address: 'ул. Никольская, 12',
            coordinates: [55.7538, 37.6198],
            workingHours: 'Пн-Пт: 10:00-20:00, Сб-Вс: 11:00-18:00',
            description: 'Центр китайской культуры с библиотекой, языковыми курсами и культурными мероприятиями',
            services: 'Языковые курсы, библиотека, выставки, чайные церемонии'
        },
        {
            id: 2,
            name: 'Библиотека восточной литературы',
            type: 'library',
            address: 'ул. Космодамианская, 24',
            coordinates: [55.7308, 37.6427],
            workingHours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-19:00',
            description: 'Специализированная библиотека с литературой на китайском языке и по китаеведению',
            services: 'Книги, журналы, интернет-зал, консультации'
        },
        {
            id: 3,
            name: 'Языковой клуб "Восток-Запад"',
            type: 'education',
            address: 'ул. Тверская, 18',
            coordinates: [55.7607, 37.6076],
            workingHours: 'Пн-Пт: 14:00-22:00, Сб-Вс: 12:00-20:00',
            description: 'Клуб для практики китайского языка и обмена культурным опытом',
            services: 'Языковые клубы, мастер-классы, культурные мероприятия'
        },
        {
            id: 4,
            name: 'Кафе языкового обмена "Dragon"',
            type: 'cafe',
            address: 'ул. Арбат, 37',
            coordinates: [55.7495, 37.5905],
            workingHours: 'Пн-Чт: 12:00-23:00, Пт-Вс: 12:00-00:00',
            description: 'Кафе для практики китайского языка в неформальной обстановке',
            services: 'Языковые встречи, игры, китайская кухня, общение'
        },
        {
            id: 5,
            name: 'Институт Конфуция при МГУ',
            type: 'education',
            address: 'Ленинские горы, 1',
            coordinates: [55.7039, 37.5286],
            workingHours: 'Пн-Пт: 8:00-20:00',
            description: 'Официальный представитель Института Конфуция, курсы китайского языка для всех уровней',
            services: 'Языковые курсы, тестирование HSK, библиотека, культурные мероприятия'
        },
        {
            id: 6,
            name: 'Центр китайского языка "Хань Юй"',
            type: 'education',
            address: 'ул. Покровка, 27',
            coordinates: [55.7599, 37.6435],
            workingHours: 'Пн-Пт: 9:00-21:00, Сб: 10:00-18:00',
            description: 'Специализированный центр изучения китайского языка с носителями языка',
            services: 'Индивидуальные и групповые занятия, подготовка к экзаменам, бизнес-китайский'
        },
        {
            id: 7,
            name: 'Музей Востока',
            type: 'center',
            address: 'Николоямская ул., 12а',
            coordinates: [55.7504, 37.6474],
            workingHours: 'Вт-Вс: 10:00-19:00',
            description: 'Крупнейший музей восточной культуры с богатой коллекцией артефактов из Китая',
            services: 'Экскурсии, лекции, выставки, образовательные программы'
        },
        {
            id: 8,
            name: 'Китайский книжный магазин "Читай-город"',
            type: 'library',
            address: 'ул. Мясницкая, 24',
            coordinates: [55.7628, 37.6498],
            workingHours: 'Пн-Вс: 10:00-22:00',
            description: 'Книжный магазин с большим выбором литературы на китайском языке и учебных материалов',
            services: 'Книги, учебники, художественная литература, китайская периодика'
        }
    ];
    
    let map;
    let clusterer;
    let placemarks = [];
    
    function initMap() {
        if (!window.ymaps) {
            console.error('Yandex Maps API не загружен');
            return;
        }
        
        window.ymaps.ready(function() {
            // Создаем карту
            map = new window.ymaps.Map('map', {
                center: [55.7512, 37.6184], // Москва
                zoom: 10,
                controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
            });
            
            // Добавляем поиск по карте
            map.controls.add('searchControl', {
                noPlacemark: false,
                size: 'large',
                position: {top: 10, right: 10}
            });
            
            // Создаем кластеризатор
            clusterer = new window.ymaps.Clusterer({
                preset: 'islands#invertedVioletClusterIcons',
                clusterDisableClickZoom: true,
                clusterOpenBalloonOnClick: true,
                clusterBalloonContentLayout: 'cluster#balloonTwoColumns'
            });
            
            // Добавляем метки
            updateMapMarkers();
            
            // Сохраняем карту в глобальную переменную для доступа из других функций
            window.map = {
                instance: map,
                updateFilters: updateMapMarkers,
                geocode: performGeocode,
                addPlacemark: addSearchPlacemark
            };
        });
    }
    
    function updateMapMarkers() {
        // Получаем активные фильтры
        const activeFilters = {
            education: document.getElementById('filter-education')?.checked || true,
            libraries: document.getElementById('filter-libraries')?.checked || true,
            centers: document.getElementById('filter-centers')?.checked || true,
            cafes: document.getElementById('filter-cafes')?.checked || true
        };
        
        // Типы ресурсов и их соответствие фильтрам
        const typeFilterMap = {
            'education': 'education',
            'library': 'libraries',
            'center': 'centers',
            'cafe': 'cafes'
        };
        
        // Фильтруем ресурсы
        const filteredResources = resources.filter(resource => {
            const filterName = typeFilterMap[resource.type];
            return activeFilters[filterName];
        });
        
        // Удаляем старые метки
        if (clusterer && map) {
            map.geoObjects.remove(clusterer);
        }
        
        placemarks = [];
        
        // Добавляем новые метки
        filteredResources.forEach(resource => {
            const placemark = createPlacemark(resource);
            placemarks.push(placemark);
        });
        
        // Добавляем метки в кластеризатор
        if (clusterer && map) {
            clusterer.add(placemarks);
            map.geoObjects.add(clusterer);
        }
        
        // Если есть метки, подгоняем карту под них
        if (placemarks.length > 0 && map) {
            const bounds = window.ymaps.util.bounds.fromPoints(placemarks.map(p => p.geometry.getCoordinates()));
            map.setBounds(bounds, {
                checkZoomRange: true,
                zoomMargin: 50
            });
        }
    }
    
    function createPlacemark(resource) {
        // Определяем иконку и цвет в зависимости от типа
        const preset = getPresetByType(resource.type);
        const iconColor = getColorByType(resource.type);
        
        // Создаем балун
        const balloonContent = `
            <div class="p-2">
                <h5 class="fw-bold mb-2 text-primary">${resource.name}</h5>
                <p class="mb-1"><strong>Тип:</strong> ${getResourceTypeName(resource.type)}</p>
                <p class="mb-1"><strong>Адрес:</strong> ${resource.address}</p>
                <p class="mb-1"><strong>Часы работы:</strong> ${resource.workingHours}</p>
                <p class="mb-2"><strong>Описание:</strong> ${resource.description}</p>
                <p class="mb-2"><strong>Услуги:</strong> ${resource.services}</p>
                <div class="d-flex gap-2 mt-2">
                    <button class="btn btn-sm btn-primary show-directions" data-coords="${resource.coordinates.join(',')}">
                        <i class="bi bi-signpost-2 me-1"></i>Маршрут
                    </button>
                    <button class="btn btn-sm btn-outline-primary save-favorite">
                        <i class="bi bi-bookmark me-1"></i>В избранное
                    </button>
                </div>
            </div>
        `;
        
        return new window.ymaps.Placemark(
            resource.coordinates,
            {
                balloonContentHeader: `<strong>${resource.name}</strong>`,
                balloonContentBody: balloonContent,
                balloonContentFooter: `<small class="text-muted">Кликните для закрытия</small>`,
                hintContent: resource.name,
                name: resource.name,
                type: resource.type
            },
            {
                preset: preset,
                iconColor: iconColor,
                balloonPanelMaxMapArea: 0
            }
        );
    }
    
    function getPresetByType(type) {
        const presets = {
            'education': 'islands#blueEducationCircleIcon',
            'library': 'islands#blueLibraryIcon',
            'center': 'islands#blueMuseumCircleIcon',
            'cafe': 'islands#blueCafeCircleIcon'
        };
        return presets[type] || 'islands#blueStretchyIcon';
    }
    
    function getColorByType(type) {
        const colors = {
            'education': '#0d6efd',      // Синий - образовательные учреждения
            'library': '#198754',        // Зеленый - библиотеки
            'center': '#6f42c1',         // Фиолетовый - культурные центры
            'cafe': '#fd7e14'            // Оранжевый - кафе
        };
        return colors[type] || '#6c757d';
    }
    
    function getResourceTypeName(type) {
        const types = {
            'education': 'Образовательное учреждение',
            'library': 'Библиотека',
            'center': 'Культурный центр',
            'cafe': 'Языковое кафе'
        };
        return types[type] || 'Неизвестно';
    }
    
    function performGeocode(query) {
        if (!map || !window.ymaps) return;
        
        window.ymaps.geocode(query, {
            results: 5
        }).then(function(res) {
            const geoObjects = res.geoObjects;
            if (geoObjects.getLength() > 0) {
                const firstObject = geoObjects.get(0);
                
                // Очищаем старые результаты поиска
                clearSearchResults();
                
                // Добавляем новую метку
                addSearchPlacemark(firstObject);
                
                // Перемещаем карту к результату
                map.setCenter(firstObject.geometry.getCoordinates(), 15);
                
                // Открываем балун
                firstObject.balloon.open();
            } else {
                api.showNotification('По вашему запросу ничего не найдено', 'warning');
            }
        }).catch(function(error) {
            console.error('Geocoding error:', error);
            api.showNotification('Ошибка при поиске на карте', 'danger');
        });
    }
    
    function addSearchPlacemark(geoObject) {
        if (!map || !window.ymaps) return;
        
        const coordinates = geoObject.geometry.getCoordinates();
        const address = geoObject.getAddressLine();
        
        const placemark = new window.ymaps.Placemark(
            coordinates,
            {
                balloonContent: `
                    <div class="p-2">
                        <h5 class="fw-bold mb-2 text-danger"><i class="bi bi-search me-1"></i>Результат поиска</h5>
                        <p class="mb-1"><strong>Адрес:</strong> ${address}</p>
                        <p class="mb-2">${geoObject.properties.get('description') || ''}</p>
                        <button class="btn btn-sm btn-primary show-directions" data-coords="${coordinates.join(',')}">
                            <i class="bi bi-signpost-2 me-1"></i>Маршрут
                        </button>
                    </div>
                `,
                hintContent: 'Результат поиска: ' + address,
                isSearchResult: true
            },
            {
                preset: 'islands#redDotIcon',
                zIndex: 100
            }
        );
        
        // Добавляем метку на карту
        map.geoObjects.add(placemark);
        
        // Сохраняем для последующего удаления
        if (!window.searchPlacemarks) {
            window.searchPlacemarks = [];
        }
        window.searchPlacemarks.push(placemark);
        
        return placemark;
    }
    
    function clearSearchResults() {
        if (window.searchPlacemarks && map) {
            window.searchPlacemarks.forEach(placemark => {
                map.geoObjects.remove(placemark);
            });
            window.searchPlacemarks = [];
        }
    }
    
    // Запускаем инициализацию карты
    if (typeof window.ymaps !== 'undefined') {
        initMap();
    } else {
        console.log('Ожидание загрузки Яндекс.Карт...');
        
        // Пытаемся инициализировать карту через 1 секунду
        setTimeout(() => {
            if (typeof window.ymaps !== 'undefined') {
                initMap();
            } else {
                console.error('Yandex Maps API не загружен после ожидания');
                document.getElementById('map-container').innerHTML = `
                    <div class="alert alert-danger m-3">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Ошибка загрузки карты. Пожалуйста, проверьте подключение к интернету и обновите страницу.
                    </div>
                `;
            }
        }, 1000);
    }
    
    // Обработчики событий для кнопок в балунах
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('show-directions') || 
            e.target.closest('.show-directions')) {
            
            e.preventDefault();
            const button = e.target.classList.contains('show-directions') ? 
                e.target : e.target.closest('.show-directions');
            
            const coords = button.getAttribute('data-coords').split(',').map(Number);
            
            if (map && window.ymaps) {
                const multiRoute = new window.ymaps.multiRouter.MultiRoute({
                    referencePoints: [
                        map.getCenter(), // Текущее местоположение пользователя
                        coords
                    ],
                    params: {
                        results: 2
                    }
                }, {
                    boundsAutoApply: true
                });
                
                map.geoObjects.add(multiRoute);
                
                api.showNotification('Маршрут построен. Вы можете изменить начальную точку в настройках маршрута.', 'info');
            }
        }
        
        if (e.target.classList.contains('save-favorite') || 
            e.target.closest('.save-favorite')) {
            
            e.preventDefault();
            api.showNotification('Место добавлено в избранное!', 'success');
        }
    });
});
