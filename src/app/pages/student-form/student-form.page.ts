import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-form',
  templateUrl: './student-form.page.html',
  styleUrls: ['./student-form.page.scss'],
})
export class StudentFormPage implements OnInit {
  studentForm!: FormGroup;

  yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
  genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  constructor(
    private fb: FormBuilder,
    private studentService: StudentService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.studentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      studentId: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(15), Validators.max(60)]],
      course: ['', [Validators.required]],
      yearLevel: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
    });
    this.prefillForm();
  }

  async prefillForm() {
    const existing = await this.studentService.loadStudent();
    if (existing) {
      this.studentForm.patchValue(existing);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.studentForm.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  async onSubmit() {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      const toast = await this.toastCtrl.create({
        message: 'Please fill all required fields correctly.',
        duration: 2500,
        color: 'danger',
        position: 'bottom'
      });
      toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Saving profile...' });
    await loading.present();

    try {
      const existing = await this.studentService.loadStudent();
      const student = {
        ...this.studentForm.value,
        profilePicture: existing?.profilePicture || undefined
      };
      await this.studentService.saveStudent(student);
      await loading.dismiss();
      this.router.navigate(['/student-profile']);
    } catch (err) {
      await loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: 'Failed to save profile. Please try again.',
        duration: 2500,
        color: 'danger',
        position: 'bottom'
      });
      toast.present();
    }
  }
}
