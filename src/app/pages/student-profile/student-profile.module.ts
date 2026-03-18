import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { StudentProfilePageRoutingModule } from './student-profile-routing.module';
import { StudentProfilePage } from './student-profile.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    StudentProfilePageRoutingModule
  ],
  declarations: [StudentProfilePage]
})
export class StudentProfilePageModule {}
