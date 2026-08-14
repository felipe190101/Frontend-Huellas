import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

type ModoCaptura = 'foto' | 'audio' | 'video' | null;

@Component({
  selector: 'app-archivos',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './archivos.html',
  styleUrls: ['./archivos.css']
})
export class Archivos implements OnInit, OnDestroy {
  archivos: any[] = [];
  filtroTexto = '';
  filtroTipo = 'todos';
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/archivos`;

  modalPermisosVisible = false;
  archivoSeleccionado: any = null;

  beneficiarios: any[] = [];
  beneficiariosSeleccionados: number[] = [];

  mediaModalVisible = false;
  modoCaptura: ModoCaptura = null;
  grabando = false;
  mensajeCaptura = '';
  tituloCaptura = '';
  submenuActivo: 'imagen' | 'audio' | 'video' | null = null;
  private ultimoModoCaptura: Exclude<ModoCaptura, null> | null = null;

  @ViewChild('vistaMedia') vistaMedia?: ElementRef<HTMLVideoElement>;

  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaChunks: BlobPart[] = [];
  private descartarGrabacion = false;

  constructor(private readonly ngZone: NgZone, private readonly router: Router) {}

  async ngOnInit() {
    await this.obtenerArchivos();
  }

  ngOnDestroy(): void {
    this.detenerFlujoMedia();
  }

  async obtenerArchivos() {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(this.apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });

      if (!resp.ok) throw new Error('Error al obtener archivos');
      const archivos = await resp.json();
      // MediaRecorder se ejecuta fuera del ciclo habitual de Angular. Al entrar
      // de nuevo en la zona, la tabla se redibuja en cuanto termina la subida.
      this.ngZone.run(() => {
        this.archivos = archivos;
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los archivos', 'error');
    }
  }

  get tiposDisponibles(): string[] {
    return [...new Set(this.archivos.map((archivo) => this.normalizarTipo(archivo.tipo)))];
  }

  get archivosFiltrados(): any[] {
    const texto = this.filtroTexto.trim().toLowerCase();
    return this.archivos.filter((archivo) => {
      const tipo = this.normalizarTipo(archivo.tipo);
      const coincideTipo = this.filtroTipo === 'todos' || tipo === this.filtroTipo;
      const coincideTexto = !texto || String(archivo.nombre || '').toLowerCase().includes(texto);
      return coincideTipo && coincideTexto;
    });
  }

  contarPorTipo(tipo: string): number {
    return this.archivos.filter((archivo) => this.normalizarTipo(archivo.tipo) === tipo).length;
  }

  iconoTipo(tipo: string): string {
    const iconos: Record<string, string> = { imagenes: '🖼️', audios: '🎵', videos: '🎬', documentos: '📄' };
    return iconos[this.normalizarTipo(tipo)] || '📁';
  }

  etiquetaTipo(tipo: string): string {
    const etiquetas: Record<string, string> = { imagenes: 'Imágenes', audios: 'Audios', videos: 'Videos', documentos: 'Documentos' };
    return etiquetas[this.normalizarTipo(tipo)] || tipo;
  }

  async subirArchivo(event: any, tipo: string) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await this.enviarArchivo(file, this.normalizarTipo(tipo), file.name);
      event.target.value = '';
    } catch (error) {
      console.error(error);
      event.target.value = '';
    }
  }

  alternarSubmenu(tipo: 'imagen' | 'audio' | 'video'): void {
    this.submenuActivo = this.submenuActivo === tipo ? null : tipo;
  }

  cerrarSubmenus(): void {
    this.submenuActivo = null;
  }

  async abrirSelector(input: HTMLInputElement | null): Promise<void> {
    if (!(await this.validarPlanAntesDeCarga())) return;
    if (!input) return;
    input.click();
  }

  async iniciarFoto(): Promise<void> {
    if (!(await this.validarPlanAntesDeCarga())) return;
    await this.abrirCaptura('foto');
  }

  async alternarAudio(): Promise<void> {
    if (this.grabando && this.modoCaptura === 'audio') {
      this.detenerGrabacion();
      return;
    }

    if (!(await this.validarPlanAntesDeCarga())) return;

    await this.abrirCaptura('audio');
    this.iniciarGrabacion('audio');
  }

  async alternarVideo(): Promise<void> {
    if (this.grabando && this.modoCaptura === 'video') {
      this.detenerGrabacion();
      return;
    }

    if (!(await this.validarPlanAntesDeCarga())) return;

    await this.abrirCaptura('video');
    this.iniciarGrabacion('video');
  }

  async subirImagenDesdeMenu(event: Event): Promise<void> {
    await this.subirArchivo(event, 'imagenes');
    this.cerrarSubmenus();
  }

  async subirAudioDesdeMenu(event: Event): Promise<void> {
    await this.subirArchivo(event, 'audios');
    this.cerrarSubmenus();
  }

  async subirVideoDesdeMenu(event: Event): Promise<void> {
    await this.subirArchivo(event, 'videos');
    this.cerrarSubmenus();
  }

  private async validarPlanAntesDeCarga(): Promise<boolean> {
    try {
      const respuesta = await fetch(`${this.baseUrl}/planes/suscripcion`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (respuesta.ok) return true;
      const data = await respuesta.json().catch(() => ({}));
      await this.mostrarRestriccionSuscripcion(data);
      return false;
    } catch {
      // Si no se puede comprobar el plan, se conserva una postura segura.
    }

    await this.mostrarRestriccionSuscripcion({});
    return false;
  }

  private async mostrarRestriccionSuscripcion(data: any): Promise<void> {
    const requiereReactivacion = data?.code === 'SUSCRIPCION_REACTIVACION_REQUERIDA';
    await Swal.fire({
      icon: 'info',
      title: requiereReactivacion ? 'Reactiva tu suscripción' : 'Plan activo requerido',
      text: requiereReactivacion
        ? 'Tu suscripción ya no está vigente. Debes reactivarla para cargar o grabar archivos.'
        : 'Debes tener un plan activo antes de cargar o grabar archivos.',
      confirmButtonText: requiereReactivacion ? 'Reactivar suscripción' : 'Ver planes',
      confirmButtonColor: '#3180ab'
    });
    this.router.navigate(['/planes']);
  }

  cerrarCaptura(cancelado = false): void {
    this.ultimoModoCaptura = this.modoCaptura ?? this.ultimoModoCaptura;

    if (this.grabando && this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.descartarGrabacion = true;
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignoramos si ya estaba detenida.
      }
    }

    this.finalizarCapturaUI();

    if (cancelado) {
      setTimeout(() => this.mostrarAvisoCancelacion(this.ultimoModoCaptura), 0);
    }
  }

  cerrarTodo(): void {
    this.cerrarSubmenus();
    this.cerrarCaptura();
  }

  async capturarFoto(): Promise<void> {
    if (this.modoCaptura !== 'foto' || !this.mediaStream || !this.vistaMedia) return;

    const video = this.vistaMedia.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const context = canvas.getContext('2d');
    if (!context) {
      Swal.fire('Error', 'No se pudo preparar la captura de imagen', 'error');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    // La imagen ya quedo copiada en el canvas: cerramos la camara y el modal
    // de inmediato, mientras se prepara y se sube el archivo en segundo plano.
    this.finalizarCapturaUI();

    canvas.toBlob(async (blob) => {
      if (!blob) {
        Swal.fire('Error', 'No se pudo generar la imagen capturada', 'error');
        return;
      }

      const archivo = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      try {
        await this.enviarArchivo(
          archivo,
          'imagenes',
          'Foto capturada desde la app',
          'La foto se tomo y guardo correctamente.'
        );
      } catch (error) {
        console.error(error);
      }
    }, 'image/jpeg', 0.92);
  }

  private async abrirCaptura(modo: Exclude<ModoCaptura, null>): Promise<void> {
    this.cerrarTodo();
    this.modoCaptura = modo;
    this.ultimoModoCaptura = modo;
    this.mediaModalVisible = true;
    this.mensajeCaptura =
      modo === 'foto'
        ? 'Activa la camara y toma la foto.'
        : modo === 'audio'
          ? 'Se grabara el audio y luego se almacenara.'
          : 'Se grabara el video y luego se almacenara.';
    this.tituloCaptura =
      modo === 'foto'
        ? 'Tomar foto'
        : modo === 'audio'
          ? 'Grabar audio'
          : 'Grabar video';

    await this.esperarRender();

    if (modo === 'foto' || modo === 'video') {
      await this.prepararVideo();
    } else {
      await this.prepararAudio();
    }
  }

  private async prepararVideo(): Promise<void> {
    try {
      const constraints: MediaStreamConstraints = {
        video: this.modoCaptura === 'foto'
          ? { facingMode: { ideal: 'environment' } }
          : true,
        audio: this.modoCaptura === 'video'
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (this.vistaMedia) {
        this.vistaMedia.nativeElement.srcObject = this.mediaStream;
        await this.vistaMedia.nativeElement.play();
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo acceder a la camara o microfono', 'error');
      this.cerrarCaptura();
    }
  }

  private async prepararAudio(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo acceder al microfono', 'error');
      this.cerrarCaptura();
    }
  }

  private iniciarGrabacion(modo: 'audio' | 'video'): void {
    if (!this.mediaStream) return;

    this.mediaChunks = [];
    this.grabando = true;
    const mimeType = modo === 'audio'
      ? (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '')
      : (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : '');

    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.mediaStream, { mimeType })
      : new MediaRecorder(this.mediaStream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.mediaChunks.push(event.data);
    };

    this.mediaRecorder.onstop = async () => {
      const seDescarta = this.descartarGrabacion;
      const modoActual = this.ultimoModoCaptura ?? this.modoCaptura;
      this.descartarGrabacion = false;
      this.grabando = false;

      if (seDescarta) {
        this.finalizarCapturaUI();
        return;
      }

      const tipoArchivo = modo === 'audio' ? 'audio' : 'video';
      const extension = 'webm';
      const mimeTypeGrabacion = this.mediaRecorder?.mimeType || (modo === 'audio' ? 'audio/webm' : 'video/webm');
      // Drive identifica mejor el archivo con un MIME estandar, sin los
      // parametros de codec que algunos navegadores agregan al MediaRecorder.
      const mimeTypeArchivo = modo === 'audio' ? 'audio/webm' : 'video/webm';
      const blob = new Blob(this.mediaChunks, {
        type: mimeTypeGrabacion
      });
      const nombre = `${tipoArchivo}-${Date.now()}.${extension}`;
      this.detenerFlujoMedia();
      this.ocultarCapturaUI();

      try {
        await this.enviarArchivo(
          new File([blob], nombre, { type: mimeTypeArchivo }),
          tipoArchivo === 'audio' ? 'audios' : 'videos',
          `${tipoArchivo} grabado desde la app`,
          modo === 'audio'
            ? 'El audio se grabo y guardo correctamente.'
            : 'El video se grabo y guardo correctamente.'
        );
      } catch (error) {
        console.error(error);
      } finally {
        this.grabando = false;
      }
    };

    this.mediaRecorder.start();
  }

  private detenerGrabacion(): void {
    if (this.mediaRecorder && this.grabando) {
      this.ultimoModoCaptura = this.modoCaptura ?? this.ultimoModoCaptura;
      this.mediaRecorder.stop();
      // No vaciamos los fragmentos aun: onstop los necesita para crear el File.
      // Solo ocultamos el modal para que la interfaz responda de inmediato.
      this.ocultarCapturaUI();
    }
  }

  private detenerFlujoMedia(): void {
    this.grabando = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignoramos si ya se detuvo.
      }
    }

    this.mediaRecorder = null;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.vistaMedia) {
      this.vistaMedia.nativeElement.srcObject = null;
    }

    this.mediaChunks = [];
  }

  private finalizarCapturaUI(): void {
    this.detenerFlujoMedia();
    this.ocultarCapturaUI();
    this.ultimoModoCaptura = null;
  }

  private ocultarCapturaUI(): void {
    this.mediaModalVisible = false;
    this.modoCaptura = null;
    this.mensajeCaptura = '';
    this.tituloCaptura = '';
  }

  private mostrarAvisoCancelacion(modo: Exclude<ModoCaptura, null> | null): void {
    if (!modo) return;

    const mensajes: Record<Exclude<ModoCaptura, null>, string> = {
      foto: 'La captura de imagen se canceló y no se guardará nada.',
      audio: 'La grabación de audio se canceló y no se guardará nada.',
      video: 'La grabación de video se canceló y no se guardará nada.'
    };

    Swal.fire({
      icon: 'info',
      title: 'Operación cancelada',
      text: mensajes[modo],
      confirmButtonColor: '#3180ab'
    });
  }

  private async enviarArchivo(file: File, tipo: string, nombre: string, mensajeExito = 'Archivo subido correctamente'): Promise<void> {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

    if (!usuario?.id_persona) {
      throw new Error('No se encontro informacion del usuario');
    }

    if (!(await this.validarEspacioDisponible(file))) return;

    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', tipo);
    formData.append('id_usuario', String(usuario.id_persona));
    formData.append('nombre', nombre || usuario.nombre || file.name);

    try {
      Swal.fire({
        title: 'Subiendo archivo...',
        text: 'Por favor espera mientras se carga tu archivo.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const resp = await fetch(`${this.apiUrl}/subir`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      Swal.close();

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (['PLAN_ACTIVO_REQUERIDO', 'SUSCRIPCION_REACTIVACION_REQUERIDA'].includes(data?.code)) {
          Swal.close();
          await this.mostrarRestriccionSuscripcion(data);
          return;
        }
        if (data?.code === 'ALMACENAMIENTO_INSUFICIENTE') {
          await Swal.fire({
            icon: 'warning',
            title: 'Almacenamiento insuficiente',
            html: `El archivo ocupa <strong>${this.formatearBytes(data.archivo_bytes || file.size)}</strong>, pero solo tienes <strong>${this.formatearBytes(data.disponible_bytes)}</strong> disponibles.`,
            confirmButtonColor: '#3180ab'
          });
          return;
        }
        throw new Error(data?.error || data?.message || 'Error al subir el archivo');
      }

      await this.obtenerArchivos();
      Swal.fire('Exito', mensajeExito, 'success');
    } catch (error) {
      Swal.close();
      throw error;
    }
  }

  private async validarEspacioDisponible(file: File): Promise<boolean> {
    try {
      const respuesta = await fetch(`${this.baseUrl}/usuarios/perfil`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!respuesta.ok) return true;

      const perfil = await respuesta.json();
      const disponible = Number(perfil?.almacenamiento?.disponible_bytes);
      if (!Number.isFinite(disponible) || file.size <= disponible) return true;

      await Swal.fire({
        icon: 'warning',
        title: 'Almacenamiento insuficiente',
        html: `El archivo ocupa <strong>${this.formatearBytes(file.size)}</strong>, pero solo tienes <strong>${this.formatearBytes(disponible)}</strong> disponibles.`,
        confirmButtonColor: '#3180ab'
      });
      return false;
    } catch {
      // El backend vuelve a comprobar la capacidad antes de guardar en Drive.
      return true;
    }
  }

  private formatearBytes(bytes: number): string {
    const valor = Math.max(0, Number(bytes) || 0);
    if (valor < 1024) return `${valor} B`;
    if (valor < 1024 ** 2) return `${(valor / 1024).toFixed(1)} KB`;
    if (valor < 1024 ** 3) return `${(valor / 1024 ** 2).toFixed(1)} MB`;
    return `${(valor / 1024 ** 3).toFixed(2)} GB`;
  }

  private normalizarTipo(tipo: string): string {
    const mapa: Record<string, string> = {
      imagen: 'imagenes',
      imagenes: 'imagenes',
      audio: 'audios',
      audios: 'audios',
      video: 'videos',
      videos: 'videos',
      documento: 'documentos',
      documentos: 'documentos'
    };

    return mapa[tipo] || tipo;
  }

  private async esperarRender(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  async eliminarArchivo(id: number) {
    Swal.fire({
      title: '¿Eliminar archivo?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem('token');
          const resp = await fetch(`${this.apiUrl}/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!resp.ok) throw new Error('Error al eliminar archivo');
          await this.obtenerArchivos();
          Swal.fire('Eliminado', 'Archivo eliminado correctamente', 'success');
        } catch (error) {
          console.error(error);
          Swal.fire('Error', 'No se pudo eliminar el archivo', 'error');
        }
      }
    });
  }

  abrirPermisos(archivo: any) {
    this.archivoSeleccionado = archivo;
    this.modalPermisosVisible = true;

    this.cargarBeneficiarios();
    this.cargarPermisosActuales(archivo.id_archivo);
  }

  cargarBeneficiarios() {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No hay token en localStorage');
      this.beneficiarios = [];
      return;
    }

    fetch(`${this.baseUrl}/beneficiarios`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Error backend al obtener beneficiarios');
        }
        return res.json();
      })
      .then((data) => {
        this.beneficiarios = Array.isArray(data) ? data : [];
      })
      .catch((err) => {
        console.error('Error cargando beneficiarios:', err);
        this.beneficiarios = [];
      });
  }

  cargarPermisosActuales(idArchivo: number) {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('No hay token');
      this.beneficiariosSeleccionados = [];
      return;
    }

    fetch(`${this.baseUrl.replace('/api', '')}/permisos/archivo/${idArchivo}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('No autorizado');
        }
        return res.json();
      })
      .then((data) => {
        this.beneficiariosSeleccionados = data.data.map((p: any) => p.id_beneficiario);
      })
      .catch((err) => {
        console.error('Error cargando permisos:', err);
        this.beneficiariosSeleccionados = [];
      });
  }

  toggleBeneficiario(idBeneficiario: number) {
    const idx = this.beneficiariosSeleccionados.indexOf(idBeneficiario);

    if (idx === -1) {
      this.beneficiariosSeleccionados.push(idBeneficiario);
    } else {
      this.beneficiariosSeleccionados.splice(idx, 1);
    }
  }

  guardarPermisos() {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('Sesion expirada');
      return;
    }

    const payload = {
      id_archivo: this.archivoSeleccionado.id_archivo,
      beneficiarios: this.beneficiariosSeleccionados
    };

    fetch(`${this.baseUrl.replace('/api', '')}/permisos/asignar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error guardando permisos');
        return res.json();
      })
      .then(() => {
        alert('Permisos actualizados correctamente');
        this.cerrarModal();
      })
      .catch((err) => console.error(err));
  }

  cerrarModal() {
    this.modalPermisosVisible = false;
    this.archivoSeleccionado = null;
    this.beneficiariosSeleccionados = [];
  }
}
