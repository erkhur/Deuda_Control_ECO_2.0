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
});