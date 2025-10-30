import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface BaseResponse<T> {
  status: string;
  message: string;
  data: T;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/notes';

  getNotes(): Observable<BaseResponse<Note[]>> {
    return this.http.get<BaseResponse<Note[]>>(this.apiUrl).pipe(catchError(this.handleError));
  }

  addNote(title: string, content: string): Observable<BaseResponse<Note>> {
    return this.http
      .post<BaseResponse<Note>>(this.apiUrl, { title, content })
      .pipe(catchError(this.handleError));
  }

  deleteNote(id: string): Observable<BaseResponse<string>> {
    return this.http
      .delete<BaseResponse<string>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error.message, error.error);
    let userMessage = 'Terjadi kesalahan. Silakan coba lagi nanti.';

    if (error.status === 400) {
      if (error.error && error.error.data && error.error.data.errors) {
        userMessage = error.error.data.errors.join(', ');
      }
    } else if (error.status === 404) {
      if (error.error && error.error.message) {
        userMessage = error.error.message;
      } else {
        userMessage = 'Data catatan tidak ditemukan.';
      }
    } else if (error.status === 0) {
      userMessage = 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.';
    }
    return throwError(() => new Error(userMessage));
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  providers: [NoteService, DatePipe],
  template: `
    <div class="min-h-screen bg-base font-sans p-4 md:p-8">
      <div class="max-w-4xl mx-auto">
        <!-- Enhanced Header with Catppuccin Theme -->
        <header class="mb-8 text-center">
          <div class="inline-flex items-center justify-center p-2 bg-surface0 rounded-2xl mb-4">
            <div class="p-4 bg-gradient-to-br from-blue to-mauve rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-10 w-10 text-base"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold text-text mb-2">Simple Notes</h1>
          <p class="text-subtext1 text-lg">Organize your thoughts with style</p>
        </header>

        <div class="bg-mantle rounded-2xl shadow-2xl p-6 mb-6">
          <div class="mb-6">
            <label for="newNoteTitle" class="block text-sm font-medium text-text mb-2">
              Judul:
            </label>
            <input
              type="text"
              id="newNoteTitle"
              class="w-full p-3 bg-surface0 border border-surface1 rounded-lg focus:ring-2 focus:ring-blue focus:outline-none transition-all text-text placeholder-subtext0"
              placeholder="Silahkan isi judul catatan..."
              [(ngModel)]="newNoteTitle"
              (keydown.enter)="addNote()"
              [disabled]="isLoading()"
            />

            <label for="newNote" class="block text-sm font-medium text-text mb-2 mt-4">
              Catatan Baru:
            </label>
            <textarea
              id="newNote"
              rows="4"
              class="w-full p-3 bg-surface0 border border-surface1 rounded-lg focus:ring-2 focus:ring-blue focus:outline-none transition-all text-text placeholder-subtext0"
              placeholder="Tulis catatan anda..."
              [(ngModel)]="newNoteContent"
              (keydown.enter)="addNote()"
              [disabled]="isLoading()"
            ></textarea>

            <button
              (click)="addNote()"
              [disabled]="isLoading()"
              class="w-full mt-4 bg-gradient-to-r from-blue to-lavender text-base px-6 py-3 rounded-lg font-semibold hover:from-blue/90 hover:to-lavender/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              @if (isLoading() && !noteToDeleteId()) {
                <div class="spinner mr-2"></div>
                <span>Menyimpan...</span>
              } @else {
                <span>Tambah Catatan</span>
              }
            </button>
          </div>

          @if (errorMessage()) {
            <div
              class="bg-red/20 border border-red/50 text-red px-4 py-3 rounded-lg mb-4"
              role="alert"
            >
              <span class="block sm:inline">{{ errorMessage() }}</span>
            </div>
          }
        </div>

        <!-- Notes Section with Enhanced Title -->
        <div class="bg-mantle rounded-2xl shadow-2xl p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold text-text flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 mr-2 text-yellow"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Daftar Catatan
            </h2>
            <div class="text-subtext1 text-sm">{{ notes().length }} catatan</div>
          </div>

          @if (isLoading() && notes().length === 0) {
            <div class="text-center text-subtext1 py-12">
              <div class="spinner inline-block mb-4"></div>
              <p>Memuat catatan...</p>
            </div>
          }

          @if (!isLoading() && notes().length === 0) {
            <div class="text-center text-subtext1 bg-surface0 p-8 rounded-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-16 w-16 mx-auto mb-4 text-subtext0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p class="text-lg">Belum ada catatan.</p>
              <p class="text-sm mt-2">Silakan tambahkan catatan baru di atas.</p>
            </div>
          }

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (note of notes(); track note.id) {
              <div
                class="bg-surface0 rounded-xl p-5 transition-all hover:shadow-lg hover:translate-y-[-2px] border border-surface1"
              >
                <div class="flex justify-between items-start mb-3">
                  <h3 class="text-lg font-semibold text-text break-words pr-2">
                    {{ note.title }}
                  </h3>
                  <button
                    (click)="requestDeleteNote(note.id)"
                    [disabled]="isLoading()"
                    class="flex-shrink-0 text-red hover:bg-red/20 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                    title="Hapus catatan"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <p class="text-subtext1 break-words mb-3 min-h-[3rem]">
                  {{ note.content }}
                </p>
                <div class="flex items-center text-xs text-subtext0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {{ note.createdAt | date: 'short' }}
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    @if (noteToDeleteId()) {
      <div class="fixed inset-0 bg-crust/80 z-50 flex items-center justify-center p-4">
        <div class="bg-mantle rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-surface1">
          <h3 class="text-xl font-semibold text-text mb-4">Konfirmasi Hapus</h3>
          <p class="text-subtext1 mb-6">Apakah Anda yakin ingin menghapus catatan ini?</p>
          <div class="flex justify-end gap-3">
            <button
              (click)="cancelDelete()"
              class="px-5 py-2 rounded-lg bg-surface0 text-text hover:bg-surface1 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              (click)="confirmDelete()"
              class="px-5 py-2 rounded-lg bg-red text-base hover:bg-red/90 transition-colors font-medium"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      /* Catppuccin Theme Variables */
      :host {
        --base: #1e1e2e;
        --mantle: #181825;
        --crust: #11111b;
        --text: #cdd6f4;
        --subtext0: #a6adc8;
        --subtext1: #bac2de;
        --surface0: #313244;
        --surface1: #45475a;
        --surface2: #585b70;
        --overlay0: #6c7086;
        --overlay1: #7f849c;
        --overlay2: #9399b2;
        --blue: #89b4fa;
        --lavender: #b4befe;
        --sapphire: #74c7ec;
        --sky: #89dceb;
        --teal: #94e2d5;
        --green: #a6e3a1;
        --yellow: #f9e2af;
        --peach: #fab387;
        --maroon: #eba0ac;
        --red: #f38ba8;
        --mauve: #cba6f7;
        --pink: #f2cdcd;
        --flamingo: #f2cdcd;
        --rosewater: #f5e0dc;
      }

      /* Apply theme colors */
      .bg-base {
        background-color: var(--base);
      }
      .bg-mantle {
        background-color: var(--mantle);
      }
      .bg-crust {
        background-color: var(--crust);
      }
      .bg-surface0 {
        background-color: var(--surface0);
      }
      .bg-surface1 {
        background-color: var(--surface1);
      }
      .bg-surface2 {
        background-color: var(--surface2);
      }
      .bg-overlay0 {
        background-color: var(--overlay0);
      }
      .bg-overlay1 {
        background-color: var(--overlay1);
      }
      .bg-overlay2 {
        background-color: var(--overlay2);
      }
      .bg-blue {
        background-color: var(--blue);
      }
      .bg-lavender {
        background-color: var(--lavender);
      }
      .bg-sapphire {
        background-color: var(--sapphire);
      }
      .bg-sky {
        background-color: var(--sky);
      }
      .bg-teal {
        background-color: var(--teal);
      }
      .bg-green {
        background-color: var(--green);
      }
      .bg-yellow {
        background-color: var(--yellow);
      }
      .bg-peach {
        background-color: var(--peach);
      }
      .bg-maroon {
        background-color: var(--maroon);
      }
      .bg-red {
        background-color: var(--red);
      }
      .bg-mauve {
        background-color: var(--mauve);
      }
      .bg-pink {
        background-color: var(--pink);
      }
      .bg-flamingo {
        background-color: var(--flamingo);
      }
      .bg-rosewater {
        background-color: var(--rosewater);
      }

      .text-base {
        color: var(--base);
      }
      .text-mantle {
        color: var(--mantle);
      }
      .text-crust {
        color: var(--crust);
      }
      .text-text {
        color: var(--text);
      }
      .text-subtext0 {
        color: var(--subtext0);
      }
      .text-subtext1 {
        color: var(--subtext1);
      }
      .text-surface0 {
        color: var(--surface0);
      }
      .text-surface1 {
        color: var(--surface1);
      }
      .text-surface2 {
        color: var(--surface2);
      }
      .text-overlay0 {
        color: var(--overlay0);
      }
      .text-overlay1 {
        color: var(--overlay1);
      }
      .text-overlay2 {
        color: var(--overlay2);
      }
      .text-blue {
        color: var(--blue);
      }
      .text-lavender {
        color: var(--lavender);
      }
      .text-sapphire {
        color: var(--sapphire);
      }
      .text-sky {
        color: var(--sky);
      }
      .text-teal {
        color: var(--teal);
      }
      .text-green {
        color: var(--green);
      }
      .text-yellow {
        color: var(--yellow);
      }
      .text-peach {
        color: var(--peach);
      }
      .text-maroon {
        color: var(--maroon);
      }
      .text-red {
        color: var(--red);
      }
      .text-mauve {
        color: var(--mauve);
      }
      .text-pink {
        color: var(--pink);
      }
      .text-flamingo {
        color: var(--flamingo);
      }
      .text-rosewater {
        color: var(--rosewater);
      }

      .border-surface0 {
        border-color: var(--surface0);
      }
      .border-surface1 {
        border-color: var(--surface1);
      }
      .border-surface2 {
        border-color: var(--surface2);
      }
      .border-blue {
        border-color: var(--blue);
      }
      .border-lavender {
        border-color: var(--lavender);
      }
      .border-red {
        border-color: var(--red);
      }

      .from-blue {
        background-image: linear-gradient(to right, var(--blue), var(--lavender));
      }
      .from-blue\\/90 {
        background-image: linear-gradient(
          to right,
          rgba(137, 180, 250, 0.9),
          rgba(180, 190, 254, 0.9)
        );
      }
      .to-lavender {
        background-image: linear-gradient(to right, var(--blue), var(--lavender));
      }
      .to-lavender\\/90 {
        background-image: linear-gradient(
          to right,
          rgba(137, 180, 250, 0.9),
          rgba(180, 190, 254, 0.9)
        );
      }
      .from-blue\\/90 {
        background-image: linear-gradient(
          to right,
          rgba(137, 180, 250, 0.9),
          rgba(180, 190, 254, 0.9)
        );
      }
      .hover\\:from-blue\\/90:hover {
        background-image: linear-gradient(
          to right,
          rgba(137, 180, 250, 0.9),
          rgba(180, 190, 254, 0.9)
        );
      }
      .hover\\:to-lavender\\/90:hover {
        background-image: linear-gradient(
          to right,
          rgba(137, 180, 250, 0.9),
          rgba(180, 190, 254, 0.9)
        );
      }

      .focus\\:ring-blue:focus {
        box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.5);
      }

      .bg-red\\/20 {
        background-color: rgba(243, 139, 168, 0.2);
      }
      .border-red\\/50 {
        border-color: rgba(243, 139, 168, 0.5);
      }
      .hover\\:bg-red\\/20:hover {
        background-color: rgba(243, 139, 168, 0.2);
      }
      .hover\\:bg-red\\/90:hover {
        background-color: rgba(243, 139, 168, 0.9);
      }
      .bg-crust\\/80 {
        background-color: rgba(17, 17, 27, 0.8);
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      div > .spinner {
        border-color: rgba(137, 180, 250, 0.3);
        border-top-color: var(--blue);
        width: 24px;
        height: 24px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private noteService = inject(NoteService);
  private datePipe = inject(DatePipe);

  notes: WritableSignal<Note[]> = signal([]);
  newNoteTitle: WritableSignal<string> = signal('');
  newNoteContent: WritableSignal<string> = signal('');
  errorMessage: WritableSignal<string | null> = signal(null);
  isLoading: WritableSignal<boolean> = signal(false);

  noteToDeleteId: WritableSignal<string | null> = signal(null);

  ngOnInit() {
    this.loadNotes();
  }

  loadNotes() {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.noteService.getNotes().subscribe({
      next: (response) => {
        this.notes.set(response.data);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  addNote() {
    const title = this.newNoteTitle().trim();
    const content = this.newNoteContent().trim();

    if (!title || !content) {
      this.errorMessage.set('Judul dan catatan tidak boleh kosong.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.noteService.addNote(title, content).subscribe({
      next: (response) => {
        console.log('Success:', response.message);
        this.newNoteTitle.set('');
        this.newNoteContent.set('');
        this.loadNotes();
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  requestDeleteNote(id: string) {
    this.noteToDeleteId.set(id);
  }

  cancelDelete() {
    this.noteToDeleteId.set(null);
  }

  confirmDelete() {
    const id = this.noteToDeleteId();
    if (!id) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.noteToDeleteId.set(null);

    this.noteService.deleteNote(id).subscribe({
      next: (response) => {
        console.log('Success:', response.message);
        this.loadNotes();
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }
}
