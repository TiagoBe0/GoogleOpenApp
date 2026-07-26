-- Quien se registró con email y contraseña eligió su rol en el formulario, así
-- que ya no hay nada que preguntarle. Sin este backfill, agregar roleChosen
-- mandaría a toda la base existente a la pantalla de bienvenida.
UPDATE "User" SET "roleChosen" = true WHERE "password" IS NOT NULL;
