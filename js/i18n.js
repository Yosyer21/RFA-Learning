// ── Internationalization (i18n) ──
const LANG_KEY = 'rfa-lang';

const translations = {
  es: {
    // Navigation
    'nav.home': 'Home',
    'nav.inicio': 'Inicio',
    'nav.clases': 'Clases',
    'nav.perfil': 'Perfil',
    'nav.salir': 'Salir',
    'nav.login': 'Iniciar sesión',
    'nav.dashboard': 'Dashboard',
    'nav.contenido': 'Contenido',
    'nav.funciones': 'Funciones',
    'nav.visual': 'Visual',

    // UI common
    'ui.loading': 'Cargando...',
    'ui.close': 'Cerrar',
    'ui.save': 'Guardar',
    'ui.cancel': 'Cancelar',
    'ui.connectionError': 'Error de conexión',
    'ui.unexpectedResponse': 'Respuesta inesperada',
    'ui.total': 'total',

    // Password strength
    'password.weak': 'Débil',
    'password.fair': 'Regular',
    'password.good': 'Buena',
    'password.strong': 'Fuerte',

    // Validation
    'validation.required': 'Campo requerido',
    'validation.minChars': 'Mínimo {0} caracteres',
    'validation.invalidFormat': 'Formato inválido',

    // Skip links
    'skip.form': 'Ir al formulario',
    'skip.content': 'Ir al contenido',
    'skip.classes': 'Ir a las clases',
    'skip.dashboard': 'Ir al dashboard',

    // Login
    'login.kicker': 'Acceso',
    'login.title': 'Iniciar sesión',
    'login.username': 'Usuario',
    'login.usernamePlaceholder': 'Tu nombre de usuario',
    'login.password': 'Contraseña',
    'login.passwordPlaceholder': 'Tu contraseña',
    'login.submit': 'Entrar',
    'login.hint': 'Admin inicial: admin / Admin1234',
    'login.createAccount': 'Crear cuenta nueva',
    'login.usernameRequired': 'Usuario requerido',
    'login.passwordRequired': 'Contraseña requerida',
    'login.authError': 'Error de autenticación',
    'login.welcome': 'Bienvenido',

    // Register
    'register.kicker': 'Cuenta nueva',
    'register.title': 'Crear cuenta',
    'register.intro': 'Completa tus datos para crear tu acceso y verificar que tu compra esté registrada.',
    'register.noteTitle': 'Antes de empezar',
    'register.noteEligibility': 'Solo puedes registrarte con el correo usado en tu compra.',
    'register.noteProduct': 'La compra debe incluir Football Language System.',
    'register.notePassword': 'Usa una contraseña fuerte y confírmala antes de enviar.',
    'register.name': 'Nombre completo',
    'register.namePlaceholder': 'Tu nombre',
    'register.username': 'Correo autorizado',
    'register.usernamePlaceholder': 'Correo asociado a la compra',
    'register.password': 'Contraseña',
    'register.passwordPlaceholder': 'Mín. 8 caracteres, mayúscula, minúscula y número',
    'register.passwordConfirm': 'Confirmar contraseña',
    'register.passwordConfirmPlaceholder': 'Repite tu contraseña',
    'register.emailInvalid': 'Debes ingresar un correo válido',
    'register.passwordConfirmRequired': 'Confirma tu contraseña',
    'register.acceptTermsRequired': 'Debes aceptar las condiciones para continuar',
    'register.passwordMismatch': 'Las contraseñas no coinciden',
    'register.acceptTerms': 'Acepto usar el servicio solo con mi cuenta autorizada y mantener mis credenciales seguras.',
    'register.submit': 'Registrarse',
    'register.hasAccount': '¿Ya tienes cuenta?',
    'register.loginLink': 'Inicia sesión',
    'register.eligibilityHint': 'Solo podrán registrarse los correos pagados del Football Language System.',
    'register.nameRequired': 'Nombre requerido',
    'register.passwordPattern': 'Debe tener mayúscula, minúscula y número',
    'register.error': 'Error al registrar',
    'register.success': 'Cuenta creada exitosamente',

    // Home
    'home.kicker': 'Dashboard',
    'home.greetMorning': 'Buenos días',
    'home.greetAfternoon': 'Buenas tardes',
    'home.greetEvening': 'Buenas noches',
    'home.subtitle': 'Continúa tu aprendizaje del lenguaje del fútbol.',
    'home.goToClasses': 'Ir a clases',
    'home.completed': 'completado',
    'home.statLevel': 'Nivel actual',
    'home.statCompleted': 'Clases completadas',
    'home.statScore': 'Puntaje total',
    'home.statStreak': 'Racha activa',
    'home.progressKicker': 'Progreso',
    'home.progressTitle': 'Avance por nivel',
    'home.activityKicker': 'Actividad',
    'home.activityTitle': 'Clases completadas',
    'home.noCompleted': 'Sin clases completadas aún',

    // Classes
    'classes.title': 'Clases',
    'classes.kicker': 'Módulos',
    'classes.subtitle': 'Módulo disponible',
    'classes.searchPlaceholder': 'Buscar clase...',
    'classes.allCategories': 'Todas las categorías',
    'classes.allLevels': 'Todos los niveles',
    'classes.levelBeginner': 'Principiante',
    'classes.levelIntermediate': 'Intermedio',
    'classes.levelAdvanced': 'Avanzado',
    'classes.modulesAvailable': '{0} módulo(s) disponible(s)',
    'classes.pageHint': 'Explora cada módulo, revisa una vista previa y abre el quiz cuando quieras practicar.',
    'classes.previewLabel': 'Vista previa',
    'classes.termsLabel': '{0} términos',
    'classes.availableModules': 'Módulos disponibles',
    'classes.visibleTerms': 'Términos visibles',
    'classes.visibleCategories': 'Categorías visibles',
    'classes.showTerms': 'Ver términos completos',
    'classes.hideTerms': 'Ocultar términos',
    'classes.visibleStats': '{0} visibles',
    'classes.voiceLabel': 'Voz de pronunciaciÃ³n',
    'classes.voiceHelp': 'Elige si quieres escuchar el tÃ©rmino en espaÃ±ol o en inglÃ©s.',
    'classes.voiceEnglish': 'InglÃ©s',
    'classes.voiceSpanish': 'EspaÃ±ol',
    'classes.voiceSaved': 'Voz de pronunciaciÃ³n guardada',
    'classes.listen': 'Escuchar',
    'classes.listenSpanish': 'Escuchar en espaÃ±ol',
    'classes.example': 'Ejemplo',
    'classes.audioNotSupported': 'Tu navegador no soporta audio por voz',
    'classes.available': 'Disponible',
    'classes.favorited': 'Favorita',
    'classes.favorite': 'Favorita',
    'classes.unfavorite': 'Quitar favorita',
    'classes.favoriteAdded': 'Clase guardada en favoritas',
    'classes.favoriteRemoved': 'Clase quitada de favoritas',
    'classes.favoriteModules': 'Favoritas',
    'classes.favoritesTitle': 'Clases favoritas',
    'classes.favoritesSubtitle': 'Guardadas en este navegador',
    'classes.completedOnPageLabel': 'Completadas en esta página',
    'classes.completedOnPage': '{0} de {1} completadas',
    'classes.recommendedLabel': 'Siguiente recomendada',
    'classes.recommendedAction': 'Practicar ahora',
    'classes.recommendedPreview': 'Ver en lista',
    'classes.recommendationEmpty': 'Completa o crea más clases para recibir una recomendación',
    'classes.reviewTitle': 'Repaso: {0}',
    'classes.retryFailed': 'Repetir falladas',
    'classes.takeQuiz': 'Tomar Quiz',
    'classes.noQuizContent': 'Esta clase no tiene contenido para quiz',
    'classes.quizTitle': 'Quiz: {0}',
    'classes.quizHint': 'Traduce al inglés cada término',
    'classes.quizPlaceholder': 'Traducción en inglés',
    'classes.submitAnswers': 'Enviar respuestas',
    'classes.quizPassed': '¡Aprobado!',
    'classes.quizFailed': 'No aprobado',
    'classes.classCompleted': 'La clase fue marcada como completada.',
    'classes.need70': 'Necesitas 70% para aprobar. ¡Inténtalo de nuevo!',
    'classes.quizPassedToast': '¡Quiz aprobado!',
    'classes.quizFailedToast': 'Quiz no aprobado',
    'classes.quizError': 'Error al enviar quiz',
    'classes.yourAnswer': 'tu respuesta',
    'classes.correct': 'correcto',

    // Dashboard
    'dashboard.title': 'Dashboard Admin',
    'dashboard.kicker': 'Panel admin',
    'dashboard.subtitle': 'Control central',
    'dashboard.hint': 'Gestiona usuarios, clases y seguimiento desde una sola vista.',
    'dashboard.stats': 'Estadísticas',
    'dashboard.paidAccounts': 'Pagos confirmados',
    'dashboard.paidAccountsHint': 'Personas que ya pagaron Football Language System y pueden registrarse.',
    'dashboard.syncing': 'Sincronizando',
    'dashboard.synced': 'Sincronizado',
    'dashboard.syncError': 'Sincronización con error',
    'dashboard.users': 'Usuarios',
    'dashboard.classes': 'Clases',
    'dashboard.namePlaceholder': 'Nombre',
    'dashboard.usernamePlaceholder': 'Usuario',
    'dashboard.passwordPlaceholder': 'Contraseña',
    'dashboard.newPasswordPlaceholder': 'Nueva contraseña (opcional)',
    'dashboard.createUser': 'Crear',
    'dashboard.createClass': 'Crear clase',
    'dashboard.titlePlaceholder': 'Título',
    'dashboard.categoryPlaceholder': 'Categoría (ej: Vocabulary)',
    'dashboard.levelPlaceholder': 'Nivel (ej: Beginner)',
    'dashboard.contentPlaceholder': 'Contenido en formato: español|english (una línea por término)',
    'dashboard.importCsv': 'Importar clases desde CSV',
    'dashboard.import': 'Importar',
    'dashboard.importError': 'Error al importar',
    'dashboard.userUpdated': 'Usuario actualizado',
    'dashboard.userDeleted': 'Usuario eliminado',
    'dashboard.userCreated': 'Usuario creado',
    'dashboard.classUpdated': 'Clase actualizada',
    'dashboard.classDeleted': 'Clase eliminada',
    'dashboard.classCreated': 'Clase creada',
    'dashboard.roleStudent': 'Estudiante',
    'dashboard.roleAdmin': 'Administrador',
    'dashboard.deleteUserConfirm': '¿Eliminar este usuario?',
    'dashboard.deleteClassConfirm': '¿Eliminar esta clase?',
    'dashboard.statUsers': 'Usuarios',
    'dashboard.statAdmins': 'Admins',
    'dashboard.statStudents': 'Estudiantes',
    'dashboard.statActive': 'Activos',
    'dashboard.statClasses': 'Clases',
    'dashboard.statProgress': 'Registros progreso',
    'dashboard.active': 'Activo',
    'dashboard.inactive': 'Inactivo',
    'dashboard.forcePassword': 'Forzar contraseña',
    'dashboard.normalPassword': 'Contraseña normal',
    'dashboard.save': 'Guardar',

    // Profile
    'profile.kicker': 'Mi cuenta',
    'profile.title': 'Perfil',
    'profile.name': 'Nombre',
    'profile.username': 'Usuario',
    'profile.role': 'Rol',
    'profile.roleAdmin': 'Administrador',
    'profile.roleStudent': 'Estudiante',
    'profile.save': 'Guardar cambios',
    'profile.quizHistory': 'Historial de quizzes',
    'profile.noQuizzes': 'Sin quizzes realizados aún',
    'profile.changePassword': 'Cambiar contraseña',
    'profile.updated': 'Perfil actualizado',
    'profile.updateError': 'Error al actualizar',
    'profile.nameRequired': 'Nombre requerido',

    // Change password
    'cp.kicker': 'Seguridad',
    'cp.title': 'Cambio obligatorio de contraseña',
    'cp.hint': 'Debes actualizar la contraseña temporal para continuar.',
    'cp.current': 'Contraseña actual',
    'cp.new': 'Nueva contraseña',
    'cp.submit': 'Actualizar',
    'cp.currentRequired': 'Contraseña actual requerida',
    'cp.passwordPattern': 'Debe tener mayúscula, minúscula y número',
    'cp.error': 'Error al actualizar contraseña',
    'cp.success': 'Contraseña actualizada. Redirigiendo...',

    // Landing / Index
    'landing.heroKicker': 'Football Language System',
    'landing.heroTitle': 'Lenguaje profesional de fútbol en',
    'landing.heroTitleHighlight': 'una sola plataforma',
    'landing.heroLead': 'RFA.Learning integra traducción, análisis y educación deportiva para mejorar la comunicación entre jugadores, entrenadores y analistas.',
    'landing.tag1': 'ES-EN',
    'landing.tag2': 'Análisis',
    'landing.tag3': 'Educación',
    'landing.tag4': 'Scouting',
    'landing.loginBtn': 'Iniciar sesión',
    'landing.viewSummary': 'Ver resumen',
    'landing.bilingualTitle': 'Comprensión bilingüe',
    'landing.bilingualDesc': 'Terminología técnica y comunicación aplicada.',
    'landing.formativeTitle': 'Uso formativo',
    'landing.formativeDesc': 'Enfoque para academias, staff técnico y jugadores.',
    'landing.heroImage1Alt': 'Entrenamiento de fútbol en campo',
    'landing.heroImage2Alt': 'Entrenador guiando práctica en cancha',
    'landing.heroImage3Alt': 'Jugador en conducción de balón',
    'landing.stat1': '500+',
    'landing.stat1Label': 'Términos técnicos',
    'landing.stat2': '2',
    'landing.stat2Label': 'Idiomas soportados',
    'landing.stat3': '5',
    'landing.stat3Label': 'Módulos integrados',
    'landing.stat4': '100%',
    'landing.stat4Label': 'Enfoque deportivo',
    'landing.signal1Title': 'Comprensión bilingüe',
    'landing.signal1Desc': 'Lenguaje técnico del fútbol en español e inglés.',
    'landing.signal2Title': 'Aplicación real',
    'landing.signal2Desc': 'Útil para academias, entrenadores y analistas.',
    'landing.signal3Title': 'Enfoque profesional',
    'landing.signal3Desc': 'Terminología, análisis y educación en una sola vista.',
    'landing.summaryLabel': 'Resumen',
    'landing.summaryTitle': 'Descripción',
    'landing.summaryP1': 'El Football Language System (FLS) es una plataforma diseñada para facilitar la comprensión, traducción y análisis del lenguaje del fútbol en español e inglés.',
    'landing.summaryP2': 'Permite acceder a terminología técnica, táctica y comunicativa utilizada en el fútbol profesional.',
    'landing.purposeLabel': 'Propósito',
    'landing.purposeTitle': 'Objetivo Del Sistema',
    'landing.purpose1': 'Traducir términos del fútbol en tiempo real.',
    'landing.purpose2': 'Comprender el lenguaje técnico del deporte.',
    'landing.purpose3': 'Analizar jugadas y partidos.',
    'landing.purpose4': 'Apoyar procesos de scouting y desarrollo de jugadores.',
    'landing.purpose5': 'Facilitar la educación deportiva.',
    'landing.featuresLabel': 'Capacidades',
    'landing.featuresTitle': 'Funcionalidades Principales',
    'landing.feature1': 'Traductor de términos (ES-EN)',
    'landing.feature1Desc': 'Traducción instantánea de palabras y frases técnicas.',
    'landing.feature2': 'Base de datos de vocabulario',
    'landing.feature2Desc': 'Organización por categorías y acceso rápido.',
    'landing.feature3': 'Módulo de análisis',
    'landing.feature3Desc': 'Interpretación de jugadas e identificación de acciones.',
    'landing.feature4': 'Perfil de jugador (opcional)',
    'landing.feature4Desc': 'Seguimiento técnico, táctico, físico y psicológico.',
    'landing.feature5': 'Sistema educativo',
    'landing.feature5Desc': 'Aprendizaje interactivo con ejemplos y explicaciones claras.',
    'landing.audienceLabel': 'Usuarios',
    'landing.audienceTitle': 'Para Quién Es Esta Plataforma',
    'landing.audience1': 'Jugadores',
    'landing.audience1Desc': 'Comprensión del lenguaje técnico y toma de decisiones en campo.',
    'landing.audience2': 'Entrenadores',
    'landing.audience2Desc': 'Mejor comunicación, explicación de conceptos y estructura de sesiones.',
    'landing.audience3': 'Analistas deportivos',
    'landing.audience3Desc': 'Vocabulario consistente para lectura, reporte y análisis.',
    'landing.audience4': 'Academias de fútbol',
    'landing.audience4Desc': 'Base educativa para programas bilingües y formativos.',
    'landing.audience5': 'Desarrolladores',
    'landing.audience5Desc': 'Soporte para productos deportivos, IA y sistemas de scouting.',
    'landing.galleryLabel': 'Visual',
    'landing.galleryTitle': 'Experiencia En Campo',
    'landing.galleryImage1Alt': 'Entrenador explicando ejercicio de fútbol',
    'landing.galleryImage2Alt': 'Jugador conduciendo balón en entrenamiento',
    'landing.galleryImage3Alt': 'Niños realizando ejercicio de control de balón',
    'landing.gallery1': 'Contexto real de formación',
    'landing.gallery2': 'Aplicación individual',
    'landing.gallery3': 'Desarrollo técnico',
    'landing.ctaLabel': 'Acceso',
    'landing.ctaTitle': 'Accede a la plataforma',
    'landing.ctaDesc': 'Inicia sesión para utilizar las herramientas de gestión y aprendizaje de RFA.Learning.',
    'landing.ctaBtn': 'Entrar ahora',
    'landing.ctaDirect': 'Acceso directo',
    'landing.footerDesc': 'Football Language System — Plataforma de lenguaje deportivo.',
    'landing.sliderCaption1': 'Entrenamiento técnico y desarrollo coordinativo.',
    'landing.sliderCaption2': 'Comunicación directa entre entrenador y jugador.',
    'landing.sliderCaption3': 'Aplicación de conceptos en contexto real.',
    'landing.sliderPrev': '← Anterior',
    'landing.sliderNext': 'Siguiente →',
    'landing.prevAria': 'Imagen anterior',
    'landing.nextAria': 'Siguiente imagen',
    'landing.dotAria': 'Ir a imagen {0}',

    // Theme
    'theme.dark': 'Modo oscuro',
    'theme.light': 'Modo claro',
  },

  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.inicio': 'Home',
    'nav.clases': 'Classes',
    'nav.perfil': 'Profile',
    'nav.salir': 'Log out',
    'nav.login': 'Log in',
    'nav.dashboard': 'Dashboard',
    'nav.contenido': 'Content',
    'nav.funciones': 'Features',
    'nav.visual': 'Gallery',

    // UI common
    'ui.loading': 'Loading...',
    'ui.close': 'Close',
    'ui.save': 'Save',
    'ui.cancel': 'Cancel',
    'ui.connectionError': 'Connection error',
    'ui.unexpectedResponse': 'Unexpected response',
    'ui.total': 'total',

    // Password strength
    'password.weak': 'Weak',
    'password.fair': 'Fair',
    'password.good': 'Good',
    'password.strong': 'Strong',

    // Validation
    'validation.required': 'Required field',
    'validation.minChars': 'Minimum {0} characters',
    'validation.invalidFormat': 'Invalid format',

    // Skip links
    'skip.form': 'Skip to form',
    'skip.content': 'Skip to content',
    'skip.classes': 'Skip to classes',
    'skip.dashboard': 'Skip to dashboard',

    // Login
    'login.kicker': 'Access',
    'login.title': 'Log in',
    'login.username': 'Username',
    'login.usernamePlaceholder': 'Your username',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'Your password',
    'login.submit': 'Log in',
    'login.hint': 'Default admin: admin / Admin1234',
    'login.createAccount': 'Create new account',
    'login.usernameRequired': 'Username required',
    'login.passwordRequired': 'Password required',
    'login.authError': 'Authentication error',
    'login.welcome': 'Welcome',

    // Register
    'register.kicker': 'New account',
    'register.title': 'Create account',
    'register.intro': 'Fill in your details to create access and verify that your purchase is registered.',
    'register.noteTitle': 'Before you begin',
    'register.noteEligibility': 'You can only register with the email used for your purchase.',
    'register.noteProduct': 'Your purchase must include Football Language System.',
    'register.notePassword': 'Use a strong password and confirm it before submitting.',
    'register.name': 'Full name',
    'register.namePlaceholder': 'Your name',
    'register.username': 'Authorized email',
    'register.usernamePlaceholder': 'Email linked to your purchase',
    'register.password': 'Password',
    'register.passwordPlaceholder': 'Min. 8 chars, uppercase, lowercase and number',
    'register.passwordConfirm': 'Confirm password',
    'register.passwordConfirmPlaceholder': 'Repeat your password',
    'register.emailInvalid': 'Enter a valid email address',
    'register.passwordConfirmRequired': 'Confirm your password',
    'register.acceptTermsRequired': 'You must accept the terms to continue',
    'register.passwordMismatch': 'Passwords do not match',
    'register.acceptTerms': 'I agree to use the service only with my authorized account and keep my credentials secure.',
    'register.submit': 'Sign up',
    'register.hasAccount': 'Already have an account?',
    'register.loginLink': 'Log in',
    'register.eligibilityHint': 'Only paid Football Language System emails can register.',
    'register.nameRequired': 'Name required',
    'register.passwordPattern': 'Must have uppercase, lowercase and number',
    'register.error': 'Registration error',
    'register.success': 'Account created successfully',

    // Home
    'home.kicker': 'Dashboard',
    'home.greetMorning': 'Good morning',
    'home.greetAfternoon': 'Good afternoon',
    'home.greetEvening': 'Good evening',
    'home.subtitle': 'Continue learning the language of football.',
    'home.goToClasses': 'Go to classes',
    'home.completed': 'completed',
    'home.statLevel': 'Current level',
    'home.statCompleted': 'Classes completed',
    'home.statScore': 'Total score',
    'home.statStreak': 'Active streak',
    'home.progressKicker': 'Progress',
    'home.progressTitle': 'Level progress',
    'home.activityKicker': 'Activity',
    'home.activityTitle': 'Completed classes',
    'home.noCompleted': 'No classes completed yet',

    // Classes
    'classes.title': 'Classes',
    'classes.kicker': 'Modules',
    'classes.subtitle': 'Available module',
    'classes.searchPlaceholder': 'Search class...',
    'classes.allCategories': 'All categories',
    'classes.allLevels': 'All levels',
    'classes.levelBeginner': 'Beginner',
    'classes.levelIntermediate': 'Intermediate',
    'classes.levelAdvanced': 'Advanced',
    'classes.modulesAvailable': '{0} module(s) available',
    'classes.pageHint': 'Browse each module, review a preview and open the quiz whenever you want to practice.',
    'classes.previewLabel': 'Preview',
    'classes.termsLabel': '{0} terms',
    'classes.availableModules': 'Available modules',
    'classes.visibleTerms': 'Visible terms',
    'classes.visibleCategories': 'Visible categories',
    'classes.showTerms': 'Show full terms',
    'classes.hideTerms': 'Hide terms',
    'classes.visibleStats': '{0} visible',
    'classes.voiceLabel': 'Pronunciation voice',
    'classes.voiceHelp': 'Choose whether you want to hear the term in Spanish or English.',
    'classes.voiceEnglish': 'English',
    'classes.voiceSpanish': 'Spanish',
    'classes.voiceSaved': 'Pronunciation voice saved',
    'classes.listen': 'Listen',
    'classes.listenSpanish': 'Listen in Spanish',
    'classes.example': 'Example',
    'classes.audioNotSupported': 'Your browser does not support speech audio',
    'classes.available': 'Available',
    'classes.favorited': 'Favorited',
    'classes.favorite': 'Favorite',
    'classes.unfavorite': 'Remove favorite',
    'classes.favoriteAdded': 'Class saved to favorites',
    'classes.favoriteRemoved': 'Class removed from favorites',
    'classes.favoriteModules': 'Favorites',
    'classes.favoritesTitle': 'Favorite classes',
    'classes.favoritesSubtitle': 'Saved in this browser',
    'classes.completedOnPageLabel': 'Completed on this page',
    'classes.completedOnPage': '{0} of {1} completed',
    'classes.recommendedLabel': 'Next recommended',
    'classes.recommendedAction': 'Practice now',
    'classes.recommendedPreview': 'Show in list',
    'classes.recommendationEmpty': 'Complete or create more classes to get a recommendation',
    'classes.reviewTitle': 'Review: {0}',
    'classes.retryFailed': 'Retry missed',
    'classes.takeQuiz': 'Take Quiz',
    'classes.noQuizContent': 'This class has no quiz content',
    'classes.quizTitle': 'Quiz: {0}',
    'classes.quizHint': 'Translate each term to English',
    'classes.quizPlaceholder': 'English translation',
    'classes.submitAnswers': 'Submit answers',
    'classes.quizPassed': 'Passed!',
    'classes.quizFailed': 'Not passed',
    'classes.classCompleted': 'Class marked as completed.',
    'classes.need70': 'You need 70% to pass. Try again!',
    'classes.quizPassedToast': 'Quiz passed!',
    'classes.quizFailedToast': 'Quiz not passed',
    'classes.quizError': 'Error submitting quiz',
    'classes.yourAnswer': 'your answer',
    'classes.correct': 'correct',

    // Dashboard
    'dashboard.title': 'Admin Dashboard',
    'dashboard.kicker': 'Admin panel',
    'dashboard.subtitle': 'Control center',
    'dashboard.hint': 'Manage users, classes and tracking from a single view.',
    'dashboard.stats': 'Statistics',
    'dashboard.users': 'Users',
    'dashboard.classes': 'Classes',
    'dashboard.namePlaceholder': 'Name',
    'dashboard.usernamePlaceholder': 'Username',
    'dashboard.passwordPlaceholder': 'Password',
    'dashboard.newPasswordPlaceholder': 'New password (optional)',
    'dashboard.createUser': 'Create',
    'dashboard.createClass': 'Create class',
    'dashboard.titlePlaceholder': 'Title',
    'dashboard.categoryPlaceholder': 'Category (e.g: Vocabulary)',
    'dashboard.levelPlaceholder': 'Level (e.g: Beginner)',
    'dashboard.contentPlaceholder': 'Content in format: spanish|english (one line per term)',
    'dashboard.importCsv': 'Import classes from CSV',
    'dashboard.import': 'Import',
    'dashboard.importError': 'Import error',
    'dashboard.userUpdated': 'User updated',
    'dashboard.userDeleted': 'User deleted',
    'dashboard.userCreated': 'User created',
    'dashboard.classUpdated': 'Class updated',
    'dashboard.classDeleted': 'Class deleted',
    'dashboard.classCreated': 'Class created',
    'dashboard.roleStudent': 'Student',
    'dashboard.roleAdmin': 'Administrator',
    'dashboard.deleteUserConfirm': 'Delete this user?',
    'dashboard.deleteClassConfirm': 'Delete this class?',
    'dashboard.statUsers': 'Users',
    'dashboard.statAdmins': 'Admins',
    'dashboard.statStudents': 'Students',
    'dashboard.statActive': 'Active',
    'dashboard.statClasses': 'Classes',
    'dashboard.statProgress': 'Progress records',
    'dashboard.paidPeople': 'Paid people',
    'dashboard.paidOrders': 'Paid orders',
    'dashboard.lastPayment': 'Last payment',
    'dashboard.paidConfirmed': 'Paid',
    'dashboard.paidAccountsEmpty': 'No paid accounts were found in the sheet.',
    'dashboard.paidAccountsUnavailable': 'The payment sheet is not available right now.',
    'dashboard.paidAccountsError': 'Error loading paid accounts',
    'dashboard.paidOrderUnknown': 'No order number',
    'dashboard.paidOrder': 'Order',
    'dashboard.paidEmail': 'Email',
    'dashboard.paidCustomer': 'Customer',
    'dashboard.paidProduct': 'Product',
    'dashboard.paidAmount': 'Amount',
    'dashboard.paidDate': 'Date',
    'dashboard.paidStatus': 'Status',
    'dashboard.active': 'Active',
    'dashboard.inactive': 'Inactive',
    'dashboard.forcePassword': 'Force password',
    'dashboard.normalPassword': 'Normal password',
    'dashboard.save': 'Save',

    // Profile
    'profile.kicker': 'My account',
    'profile.title': 'Profile',
    'profile.name': 'Name',
    'profile.username': 'Username',
    'profile.role': 'Role',
    'profile.roleAdmin': 'Administrator',
    'profile.roleStudent': 'Student',
    'profile.save': 'Save changes',
    'profile.quizHistory': 'Quiz history',
    'profile.noQuizzes': 'No quizzes taken yet',
    'profile.changePassword': 'Change password',
    'profile.updated': 'Profile updated',
    'profile.updateError': 'Error updating profile',
    'profile.nameRequired': 'Name required',

    // Change password
    'cp.kicker': 'Security',
    'cp.title': 'Mandatory password change',
    'cp.hint': 'You must update your temporary password to continue.',
    'cp.current': 'Current password',
    'cp.new': 'New password',
    'cp.submit': 'Update',
    'cp.currentRequired': 'Current password required',
    'cp.passwordPattern': 'Must have uppercase, lowercase and number',
    'cp.error': 'Error updating password',
    'cp.success': 'Password updated. Redirecting...',

    // Landing / Index
    'landing.heroKicker': 'Football Language System',
    'landing.heroTitle': 'Professional football language in',
    'landing.heroTitleHighlight': 'one platform',
    'landing.heroLead': 'RFA.Learning integrates translation, analysis and sports education to improve communication between players, coaches and analysts.',
    'landing.tag1': 'ES-EN',
    'landing.tag2': 'Analysis',
    'landing.tag3': 'Education',
    'landing.tag4': 'Scouting',
    'landing.loginBtn': 'Log in',
    'landing.viewSummary': 'View summary',
    'landing.bilingualTitle': 'Bilingual understanding',
    'landing.bilingualDesc': 'Technical terminology and applied communication.',
    'landing.formativeTitle': 'Formative use',
    'landing.formativeDesc': 'Designed for academies, technical staff and players.',
    'landing.heroImage1Alt': 'Football training on the field',
    'landing.heroImage2Alt': 'Coach guiding practice on the pitch',
    'landing.heroImage3Alt': 'Player dribbling the ball',
    'landing.stat1': '500+',
    'landing.stat1Label': 'Technical terms',
    'landing.stat2': '2',
    'landing.stat2Label': 'Supported languages',
    'landing.stat3': '5',
    'landing.stat3Label': 'Integrated modules',
    'landing.stat4': '100%',
    'landing.stat4Label': 'Sports focus',
    'landing.signal1Title': 'Bilingual understanding',
    'landing.signal1Desc': 'Technical football language in Spanish and English.',
    'landing.signal2Title': 'Real-world application',
    'landing.signal2Desc': 'Useful for academies, coaches and analysts.',
    'landing.signal3Title': 'Professional focus',
    'landing.signal3Desc': 'Terminology, analysis and education in one view.',
    'landing.summaryLabel': 'Summary',
    'landing.summaryTitle': 'Description',
    'landing.summaryP1': 'The Football Language System (FLS) is a platform designed to facilitate the understanding, translation and analysis of football language in Spanish and English.',
    'landing.summaryP2': 'It provides access to technical, tactical and communicative terminology used in professional football.',
    'landing.purposeLabel': 'Purpose',
    'landing.purposeTitle': 'System Objective',
    'landing.purpose1': 'Translate football terms in real time.',
    'landing.purpose2': 'Understand the technical language of the sport.',
    'landing.purpose3': 'Analyze plays and matches.',
    'landing.purpose4': 'Support scouting and player development processes.',
    'landing.purpose5': 'Facilitate sports education.',
    'landing.featuresLabel': 'Capabilities',
    'landing.featuresTitle': 'Main Features',
    'landing.feature1': 'Term translator (ES-EN)',
    'landing.feature1Desc': 'Instant translation of technical words and phrases.',
    'landing.feature2': 'Vocabulary database',
    'landing.feature2Desc': 'Organization by categories and quick access.',
    'landing.feature3': 'Analysis module',
    'landing.feature3Desc': 'Play interpretation and action identification.',
    'landing.feature4': 'Player profile (optional)',
    'landing.feature4Desc': 'Technical, tactical, physical and psychological tracking.',
    'landing.feature5': 'Educational system',
    'landing.feature5Desc': 'Interactive learning with clear examples and explanations.',
    'landing.audienceLabel': 'Users',
    'landing.audienceTitle': 'Who Is This Platform For',
    'landing.audience1': 'Players',
    'landing.audience1Desc': 'Understanding technical language and on-field decision making.',
    'landing.audience2': 'Coaches',
    'landing.audience2Desc': 'Better communication, concept explanation and session structure.',
    'landing.audience3': 'Sports analysts',
    'landing.audience3Desc': 'Consistent vocabulary for reading, reporting and analysis.',
    'landing.audience4': 'Football academies',
    'landing.audience4Desc': 'Educational foundation for bilingual and formative programs.',
    'landing.audience5': 'Developers',
    'landing.audience5Desc': 'Support for sports products, AI and scouting systems.',
    'landing.galleryLabel': 'Gallery',
    'landing.galleryTitle': 'Field Experience',
    'landing.galleryImage1Alt': 'Coach explaining a football drill',
    'landing.galleryImage2Alt': 'Player dribbling the ball in training',
    'landing.galleryImage3Alt': 'Children doing ball control exercise',
    'landing.gallery1': 'Real training context',
    'landing.gallery2': 'Individual application',
    'landing.gallery3': 'Technical development',
    'landing.ctaLabel': 'Access',
    'landing.ctaTitle': 'Access the platform',
    'landing.ctaDesc': 'Log in to use the management and learning tools of RFA.Learning.',
    'landing.ctaBtn': 'Enter now',
    'landing.ctaDirect': 'Direct access',
    'landing.footerDesc': 'Football Language System — Sports language platform.',
    'landing.sliderCaption1': 'Technical training and coordination development.',
    'landing.sliderCaption2': 'Direct communication between coach and player.',
    'landing.sliderCaption3': 'Application of concepts in real context.',
    'landing.sliderPrev': '← Previous',
    'landing.sliderNext': 'Next →',
    'landing.prevAria': 'Previous image',
    'landing.nextAria': 'Next image',
    'landing.dotAria': 'Go to image {0}',

    // Theme
    'theme.dark': 'Dark mode',
    'theme.light': 'Light mode',
  },
};

// ── Core functions ──
const classTitleVariants = [
  { es: 'Posiciones y Roles en el Campo', en: 'Positions and Roles on the Field' },
  { es: 'Acciones del Juego', en: 'Game Actions' },
  { es: 'Reglas y Arbitraje', en: 'Rules and Officiating' },
  { es: 'Táctica y Estrategia', en: 'Tactics and Strategy' },
  { es: 'Análisis y Scouting', en: 'Analysis and Scouting' },
  { es: 'Lenguaje del Comentarista y Diferencias Clave', en: 'Commentator Language and Key Differences' },
  { es: 'Lenguaje del Comentarista y Jugadas Clave', en: 'Commentator Language and Key Plays' },
];

const classCategoryVariants = [
  { es: 'Posiciones', en: 'Positions' },
  { es: 'Acciones', en: 'Actions' },
  { es: 'Arbitraje', en: 'Officiating' },
  { es: 'Táctica', en: 'Tactics' },
  { es: 'Análisis', en: 'Analysis' },
  { es: 'Comunicación', en: 'Communication' },
];

const classLevelVariants = [
  { es: 'Principiante', en: 'Beginner' },
  { es: 'Intermedio', en: 'Intermediate' },
  { es: 'Avanzado', en: 'Advanced' },
  { es: 'Beginner', en: 'Beginner' },
  { es: 'Intermediate', en: 'Intermediate' },
  { es: 'Advanced', en: 'Advanced' },
];

const roleVariants = [
  { es: 'student', en: 'student' },
  { es: 'admin', en: 'admin' },
  { es: 'Estudiante', en: 'Student' },
  { es: 'Administrador', en: 'Administrator' },
  { es: 'Student', en: 'Student' },
  { es: 'Administrator', en: 'Administrator' },
];

function normalizeDisplayText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function translateClassTitle(title) {
  return translateKnownClassValue(title, classTitleVariants);
}

function translateClassCategory(category) {
  return translateKnownClassValue(category, classCategoryVariants);
}

function translateClassLevel(level) {
  return translateKnownClassValue(level, classLevelVariants);
}

function translateUserRole(role) {
  const normalized = normalizeDisplayText(role);
  const match = roleVariants.find((item) => {
    return normalizeDisplayText(item.es) === normalized || normalizeDisplayText(item.en) === normalized;
  });

  if (!match) return role || '';
  return currentLang === 'en' ? match.en : match.es;
}

function translateKnownClassValue(value, variants) {
  const normalized = normalizeDisplayText(value);
  const match = variants.find((item) => {
    return normalizeDisplayText(item.es) === normalized || normalizeDisplayText(item.en) === normalized;
  });

  if (!match) return value || '';
  return currentLang === 'en' ? match.en : match.es;
}

function detectLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && translations[saved]) return saved;
  const browserLang = (navigator.language || navigator.userLanguage || 'es').slice(0, 2).toLowerCase();
  return translations[browserLang] ? browserLang : 'es';
}

let currentLang = detectLanguage();

function t(key, ...args) {
  let text = (translations[currentLang] && translations[currentLang][key]) || translations.es[key] || key;
  args.forEach((val, i) => {
    text = text.replace(`{${i}}`, val);
  });
  return text;
}

function getCurrentLang() {
  return currentLang;
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.setAttribute('lang', lang);
  translatePage();
  updateLangToggle();
  window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: currentLang } }));
}

function translatePage() {
  // data-i18n → textContent
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  // data-i18n-html → innerHTML (for elements with inner tags)
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  // data-i18n-placeholder → placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  // data-i18n-aria → aria-label
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.dataset.i18nAria));
  });
  // data-i18n-alt → alt
  document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
    el.setAttribute('alt', t(el.dataset.i18nAlt));
  });
}

// ── Language toggle (injected into nav) ──
function injectLangToggle() {
  const nav = document.querySelector('header nav');
  if (!nav) return;
  const btn = document.createElement('button');
  btn.className = 'btn btn-small btn-lang';
  btn.id = 'lang-toggle';
  btn.textContent = currentLang === 'es' ? 'EN' : 'ES';
  btn.title = currentLang === 'es' ? 'Switch to English' : 'Cambiar a español';
  btn.addEventListener('click', () => {
    setLanguage(currentLang === 'es' ? 'en' : 'es');
  });
  nav.insertBefore(btn, nav.firstChild);
}

function updateLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.textContent = currentLang === 'es' ? 'EN' : 'ES';
  btn.title = currentLang === 'es' ? 'Switch to English' : 'Cambiar a español';
}

window.translateClassTitle = translateClassTitle;
window.translateClassCategory = translateClassCategory;
window.translateClassLevel = translateClassLevel;
window.translateUserRole = translateUserRole;
window.getCurrentLang = getCurrentLang;

// ── Initialize on DOM ready ──
document.documentElement.setAttribute('lang', currentLang);

window.addEventListener('DOMContentLoaded', () => {
  injectLangToggle();
  translatePage();
});
