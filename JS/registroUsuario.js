document.addEventListener('DOMContentLoaded', () => {
    const registroForm = document.querySelector('form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const toggleBtn = document.getElementById('togglePassword');
    const toggleConfirmBtn = document.getElementById('toggleConfirmPassword');
    const checkLength = document.getElementById('checkLength');
    const checkSymbol = document.getElementById('checkSymbol');

    if (registroForm) {
        registroForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

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

    // Toggle mostrar/ocultar contraseña (sincronizados)
    function toggleVisibility(input, btn) {
        const icon = btn.querySelector('span.material-symbols-outlined');
        const isPassword = input.getAttribute('type') === 'password';
        
        // Cambiar ambos campos simultáneamente
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
        
        // Actualizar iconos de ambos botones
        const iconP = toggleBtn.querySelector('span.material-symbols-outlined');
        const iconC = toggleConfirmBtn.querySelector('span.material-symbols-outlined');
        
        if (iconP) iconP.textContent = isPassword ? 'visibility_off' : 'visibility';
        if (iconC) iconC.textContent = isPassword ? 'visibility_off' : 'visibility';
        
        toggleBtn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
        toggleConfirmBtn.setAttribute('aria-label', isPassword ? 'Ocultar confirmar contraseña' : 'Mostrar confirmar contraseña');
    }

    if (passwordInput && toggleBtn) {
        toggleBtn.addEventListener('click', () => toggleVisibility(passwordInput, toggleBtn));
    }

    if (confirmPasswordInput && toggleConfirmBtn) {
        toggleConfirmBtn.addEventListener('click', () => toggleVisibility(confirmPasswordInput, toggleConfirmBtn));
    }

    // Validaciones en tiempo real para los checks de contraseña
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
        updatePasswordChecks(); // Ejecutar al cargar para reflejar estado inicial
    }
});