import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Student, StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-profile',
  templateUrl: './student-profile.page.html',
  styleUrls: ['./student-profile.page.scss'],
})
export class StudentProfilePage implements OnInit {
  student: Student | null = null;
  isLoading = true;

  constructor(
    private studentService: StudentService,
    private router: Router,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {}

  async ionViewWillEnter() {
    this.isLoading = true;
    this.student = await this.studentService.loadStudent();
    this.isLoading = false;
    if (!this.student) {
      this.router.navigate(['/student-form'], { replaceUrl: true });
    }
  }

  editProfile() {
    this.router.navigate(['/student-form']);
  }

  async changePhoto() {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Profile Picture',
      cssClass: 'photo-action-sheet',
      buttons: [
        {
          text: 'Take Photo',
          icon: 'camera-outline',
          handler: () => this.capturePhoto()
        },
        {
          text: 'Choose from Gallery',
          icon: 'images-outline',
          handler: () => this.capturePhoto()
        },
        {
          text: 'Remove Photo',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => this.removePhoto()
        },
        {
          text: 'Cancel',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await sheet.present();
  }

  async capturePhoto() {
    const dataUrl = await this.studentService.takePicture();

    if (dataUrl && this.student) {
      const loading = await this.loadingCtrl.create({ message: 'Creating caricature...' });
      await loading.present();

      try {
        const processed = await this.studentService.applyAIFilter(dataUrl);
        this.student.profilePicture = processed;
        await this.studentService.saveStudent(this.student);
      } finally {
        await loading.dismiss();
      }

      const toast = await this.toastCtrl.create({
        message: 'Profile picture updated!',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      toast.present();
    }
  }

  async removePhoto() {
    const alert = await this.alertCtrl.create({
      header: 'Remove Photo',
      message: 'Are you sure you want to remove your profile picture?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: async () => {
            if (this.student) {
              this.student.profilePicture = undefined;
              await this.studentService.saveStudent(this.student);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async clearAllData() {
    const alert = await this.alertCtrl.create({
      header: 'Clear Profile',
      message: 'This will delete all your student data. This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear',
          role: 'destructive',
          handler: async () => {
            await this.studentService.clearStudent();
            this.router.navigate(['/student-form'], { replaceUrl: true });
          }
        }
      ]
    });
    await alert.present();
  }

  getInitials(): string {
    if (!this.student?.name) return '?';
    return this.student.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getGenderIcon(): string {
    if (!this.student?.gender) return 'person-outline';
    const g = this.student.gender.toLowerCase();
    if (g === 'male') return 'male-outline';
    if (g === 'female') return 'female-outline';
    return 'person-outline';
  }
}
