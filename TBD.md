**LivePlace**

1) Un place puede tener muchos matches, de los cuales el usuario elegirá cuál tomar. Todos los matches se mantienen sin cambios en la base de datos salvo que:
    - El usuario seller acepta un match -> los demás matches se cancelan salvo que el buyer o seller cancelen su match. Se dispara el socket que actualiza la pantalla de los demás usuarios para avisarles que su match fue cancelado y el socket que elimina el parking actual de la home page
    - El usuario buyer o seller cancele el match -> cancelled:true (hay que agregar botón de cancelar). Se dispara el socket que avisa al usuario contrario que el match fue cancelado. En ambos casos se dispara también el socket que vuelve a habilitar el parking actual en el mapa de la home
    - El buyer y el seller se encuentren en un mismo punto, acá:
        - Si paga con efectivo, se preguntará a ambos usuarios si gestionaron el pago. Si es así: -> payed:true
        - Si paga con mercadopago, en el momento del encuentro aparecerá la opción de pagar o cancelar -> payed:true o cancelled:true

**HomePage**

1) Agregar al mapa la opción de zoom y fitToCoordinates


**SOCKETS**

- newPlace: cuando un nuevo parking se crea en base de datos (parkingController:create) y actualiza los parking disponibles en el mapa (HomePage)
    - Desde: LivePlace
    - Afecta: HomePage
    - Api: parkingController:create

- takenMatch: cuando un seller acepta el match con un buyer (matchController:update). Elimina el parking disponible en el mapa (HomePage) y cancela el match de los demás buyers (Summary). Al mismo tiempo, avisa al buyer aceptado que se dirija al lugar (Summary)
    - Desde: LivePlace
    - Afecta: Summary, HomePage
    - Api: matchController:update

- cancelledMatch: cuando un seller cancela un match con un buyer (matchController:update). Reaparece el parking disponible en el mapa (HomePage) y no modifica el match de los demás buyers (Summary). Al mismo tiempo, avisa al buyer aceptado que su match fue cancelado (Summary)
    - Desde: LivePlace
    - Afecta: Summary, HomePage
    - Api: matchController:update

- userMoved: desde (Summary) se va trackeando la ubicación del buyer (matchController:update) y se va actualizando en la pantalla del seller (LivePlace)
    - Desde: Summary
    - Afecta: LivePlace
    - Api: matchController:update

- deletedMatch: cuando un buyer cancela un match con un seller (matchController:delete). Elimina el match en el mapa del seller (LivePlace)
    - Desde: Summary
    - Afecta: LivePlace
    - Api: matchController:delete

- deletePlace: cuando el seller abandona la búsqueda (parkingController:delete). Elimina el parking disponible en el mapa (HomePage) y cancela el match para todos los buyers (Summary)
    - Desde: LivePlace
    - Afecta: Summary, HomePage
    - Api: parkingController:delete

**SUMMARY**

Hay que cambiar el nombre de esta pagina. Porque no es un resumen de compra, sino que debería quedarse cargando en modo de "Esperando a que el conductor acepte tu solicitud de match". En caso que lo acepte, si se lograría ver el check verde y el mapa con la dirección al lugar

Al cargar, espera por el socket matchTaken. Si el usuario que envía en el parametro matchId coincide con el matchId del usuario, muestra el check. Caso contrario, muestra que no fue aceptado o fue cancelado

**9 de Mayo de 2024**

- Agregar páginas para acceder a Tu Búsqueda (tanto para sellers como para buyers). En donde aparezca desde la home en el ícono del menú un punto rojo avisando que hay una búsqueda activa.
- Crear la página del perfil del seller (no editable)
- Manejar notificaciones generales del sitio con Socket IO: más allá de los socket de cada página para manejar estados o hacer llamadas a apis, necesito crear algo como 'Notificaciones' para que aparezcan en cualquier página que el usuario se encuentre

**QA**

- Al crear un auto o documento, vuelve atrás a "Mi Perfil" pero no actualiza los datos con el auto o documento nuevo creado
- Si al iniciar hay "alerta" en el menu, al ingresar a Pendiente o a Compartir debería saltar directamente a la página en el estado en el que se encuentra

**2024-07-04**

- [X] Pasar la variable *screen* correctamente a la funcion showNotification en NotificationProvider.js
- [X] Agregar el socket para actualizar los chats frente a un nuevo mensaje estando en la pantalla de Chats
- [X] Ordenar los chats según el createdDate del último mensaje que cada uno tenga
- [X] Eliminar de la lista los chats con el mismo usuario
- [X] Hacer un scroll down al escribir un nuevo mensaje para visualizarlo
- [X] Distinguir los mensajes entre leidos y no leidos en el listado de Chats
- [X*] Detectar si un nuevo mensaje que acaba de llegar es visible en pantalla. Si lo es, marcar como leido, si no, mostrar cartel de nuevo mensaje
- [X] Crear pantalla de Connection Error (no hay internet)
- [X] Crear habilitación de medio de pago
- [X] Crear pago con mercadopago
- [X] Modificar utils/mercadopago.js y crear una api que traiga los medios de pago SEGUN EL USUARIO en lugar de llamar directamente a la api de MP
- [X] Cambiar todos los scrollViewContainer por un componente que tenga un onLayout y cambie de altura dependiendo de la altura de su child