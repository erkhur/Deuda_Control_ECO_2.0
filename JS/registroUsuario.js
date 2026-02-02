document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.querySelector('form');

    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Captura de inputs (basado en el orden del HTML proporcionado)
            const inputs = registroForm.querySelectorAll('input');
            const nombre = inputs[0].value;
            const email = inputs[1].value;
            const password = inputs[2].value;
            const confirmPassword = inputs[3].value;

            // --- Validaciones Senior ---

            // 1. Coincidencia de contraseñas
            if (password !== confirmPassword) {
                return Swal.fire({
                    icon: 'warning',
                    title: 'Atención',
                    text: 'Las contraseñas no coinciden.',
                    confirmButtonColor: '#135bec'
                });
            }

            // 2. Longitud mínima
            if (password.length < 8) {
                return Swal.fire({
                    icon: 'warning',
                    title: 'Seguridad débil',
                    text: 'La contraseña debe tener al menos 8 caracteres.',
                    confirmButtonColor: '#135bec'
                });
            }

            // 3. Verificar si el usuario ya existe
            let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
            const existe = usuarios.find(u => u.email === email);

            if (existe) {
                return Swal.fire({
                    icon: 'error',
                    title: 'Usuario existente',
                    text: 'Este correo ya está registrado.',
                    confirmButtonColor: '#135bec'
                });
            }

            // --- Proceso de Guardado ---

            const nuevoUsuario = {
                nombre,
                email,
                password, // Nota: En producción esto NUNCA se guarda en texto plano, siempre se hashea.
                logeado: false
            };

            usuarios.push(nuevoUsuario);
            localStorage.setItem('usuarios', JSON.stringify(usuarios));

            await Swal.fire({
                icon: 'success',
                title: '¡Registro Exitoso!',
                text: 'Tu cuenta ha sido creada correctamente.',
                timer: 2000,
                showConfirmButton: false
            });

            // Redirección al login
            window.location.href = 'index.html';
        });
    }

    // Botón para volver al login si ya tiene cuenta
    const linkLogin = document.querySelector('a[href="#"]');
    if (linkLogin && linkLogin.textContent.includes('Inicia sesión')) {
        linkLogin.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // Toggle mostrar/ocultar contraseña (ojo)
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    if (passwordInput && toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const icon = toggleBtn.querySelector('span.material-symbols-outlined');
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            if (icon) icon.textContent = isPassword ? 'visibility_off' : 'visibility';
            // Si existe el campo de confirmación y su toggle, sincronizarlos
            if (confirmPasswordInput) {
                confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
            }
            if (toggleConfirmBtn) {
                const iconC = toggleConfirmBtn.querySelector('span.material-symbols-outlined');
                if (iconC) iconC.textContent = isPassword ? 'visibility_off' : 'visibility';
                toggleConfirmBtn.setAttribute('aria-label', isPassword ? 'Ocultar confirmar contraseña' : 'Mostrar confirmar contraseña');
            }
            // Actualizar aria-label del propio botón
            toggleBtn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        });
    }

    // Toggle para el campo Confirmar Contraseña
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleConfirmBtn = document.getElementById('toggleConfirmPassword');
    if (confirmPasswordInput && toggleConfirmBtn) {
        toggleConfirmBtn.addEventListener('click', () => {
            const icon = toggleConfirmBtn.querySelector('span.material-symbols-outlined');
            const isPassword = confirmPasswordInput.getAttribute('type') === 'password';
            confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
            if (icon) icon.textContent = isPassword ? 'visibility_off' : 'visibility';
            // Sincronizar con el campo de contraseña principal
            if (passwordInput) {
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            }
            if (toggleBtn) {
                const iconP = toggleBtn.querySelector('span.material-symbols-outlined');
                if (iconP) iconP.textContent = isPassword ? 'visibility_off' : 'visibility';
                toggleBtn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
            }
            // Actualizar aria-label del propio botón
            toggleConfirmBtn.setAttribute('aria-label', isPassword ? 'Ocultar confirmar contraseña' : 'Mostrar confirmar contraseña');
        });
    }

    // Validaciones en tiempo real para los checks de contraseña
    const checkLength = document.getElementById('checkLength');
    const checkSymbol = document.getElementById('checkSymbol');

    function updatePasswordChecks() {
        if (!passwordInput) return;
        const val = passwordInput.value || '';

        // Longitud mínima
        if (checkLength) {
            if (val.length >= 8) {
                checkLength.textContent = 'check_circle';
                checkLength.classList.add('text-green-500');
            } else {
                checkLength.textContent = 'circle';
                checkLength.classList.remove('text-green-500');
            }
        }

        // Número o símbolo
        if (checkSymbol) {
            const hasNumberOrSymbol = /[0-9]|[^A-Za-z0-9\s]/.test(val);
            if (hasNumberOrSymbol) {
                checkSymbol.textContent = 'check_circle';
                checkSymbol.classList.add('text-green-500');
            } else {
                checkSymbol.textContent = 'circle';
                checkSymbol.classList.remove('text-green-500');
            }
        }
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordChecks);
        // Ejecutar al cargar para reflejar estado inicial (si hay valor)
        updatePasswordChecks();
    }
});