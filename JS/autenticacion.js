document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("form");
  // Opción 1: si el botón tiene un id
  const btnRegistrarse =
    document.getElementById("btnRegistrarse") ||
    document.querySelector("header button");

  // 1. Lógica para redirigir a Registro
  if (btnRegistrarse) {
    btnRegistrarse.addEventListener("click", () => {
      window.location.href = "registroUsuario.html";
    });
  }

  const passwordInput = document.getElementById("password");
  const toggleBtn = passwordInput.parentElement.querySelector("button");
  const icon = toggleBtn.querySelector("span");

  toggleBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      icon.textContent = "visibility_off"; // cambia el ícono
    } else {
      passwordInput.type = "password";
      icon.textContent = "visibility"; // vuelve al ícono original
    }
  });


  // 2. Lógica de Inicio de Sesión
  if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    let usuariosRegistrados = JSON.parse(localStorage.getItem("usuarios")) || [];

    const isAdmin = email === "admin@gmail.com" && password === "admin@1234";
    const isUser = usuariosRegistrados.find(
      (u) => u.email === email && u.password === password
    );

    if (isAdmin || isUser) {
      // 🔑 Primero desmarcamos todos los usuarios
      usuariosRegistrados = usuariosRegistrados.map(u => ({ ...u, logeado: false }));

      if (isUser) {
        // Marcamos al usuario como logeado
        isUser.logeado = true;

        // Actualizamos la lista con el usuario logeado
        usuariosRegistrados = usuariosRegistrados.map(u =>
          u.email === isUser.email ? isUser : u
        );

        localStorage.setItem("usuarios", JSON.stringify(usuariosRegistrados));
      }

      if (isAdmin) {
        // Si es admin, lo tratamos como un usuario dentro del array
        const adminUser = {
          nombre: "Super Admin",
          email: "admin@gmail.com",
          password: "admin@1234",
          rol: "Administrador",
          logeado: true
        };

        // Eliminamos cualquier admin previo y lo volvemos a insertar
        usuariosRegistrados = usuariosRegistrados.filter(u => u.email !== adminUser.email);
        usuariosRegistrados.push(adminUser);

        localStorage.setItem("usuarios", JSON.stringify(usuariosRegistrados));
      }

      await Swal.fire({
        icon: "success",
        title: "Acceso Concedido",
        text: `Bienvenido de nuevo, ${isAdmin ? "Super Admin" : isUser.nombre}`,
        timer: 2000,
        showConfirmButton: false,
      });

      window.location.href = "dashboard.html";
    } else {
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: "Correo o contraseña incorrectos.",
        confirmButtonColor: "#135bec",
      });
    }
  });
}


});
