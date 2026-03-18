import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'student-form',
    loadChildren: () => import('./pages/student-form/student-form.module').then(m => m.StudentFormPageModule)
  },
  {
    path: 'student-profile',
    loadChildren: () => import('./pages/student-profile/student-profile.module').then(m => m.StudentProfilePageModule)
  },
  {
    path: '',
    redirectTo: 'student-form',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
