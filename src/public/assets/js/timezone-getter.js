window.addEventListener('DOMContentLoaded', event => {

    const timezone = document.getElementById('timezone');
    const login_form = document.getElementById('form');


    login_form.addEventListener('submit', (submit_event) => {
        submit_event.preventDefault(); // Impedir que se envíe el formulario automáticamente

        const d = new Date();
        const a = d.toLocaleString("ja", {timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone}).split(/[/\s:]/);
        a[1]--;
        const t1 = Date.UTC.apply(null, a);
        const t2 = new Date(d).setMilliseconds(0);
        timezone.value = ((t1 - t2) / 60 / 1000);

        login_form.submit();
    });
});