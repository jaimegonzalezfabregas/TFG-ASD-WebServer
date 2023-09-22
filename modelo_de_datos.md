Funcionalidades:
relacion entre (sitio,tiempo) -> persona
    las asistencias registradas
    las asistencias programadas
        modeladas con reglas
            cada semana
            dia en particular

Cotejar aula y tiempo. El servidor puede informar acerca de el estado de cualquier aula en cualquier tiempo
    los datos ofrecidos respecto del aula tienen tres partes, quien ha estado y quien deberia estar, el estado de la asistencia
        ocupación reservada: persona
        ocupacion observada: persona
        estado: 
            - pasada la hora:
              - correcto: quien ha estado == quien tenia que estar || no tenia que haber nadie
              - irregular: "" != ""
              - incorrecto: no se ha registado nadie
            - antes de la hora
              - ocupado
              - libre


funcionalidad de cada regla
    decidir si este aula en este tiempo está reservada por ella
        si si se aplica:
            proporcionar explicación humana
            dadas las asistencias del tramo de tiempo en el aula decidir el estado


ejemplos de flexibilidad
    este profe solo da clases los miercoles pares
    este taller solo se hace el dia 3 de febrero
    a este laboratorio puede ir el profe a o el b
    entre estos 3 labs tienen que registrarse el profe a, b y c
