/**
 * Created by jeff on 23/03/2015.
 */
var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var paths = {
	styles: ['./assets/styles/app.scss'],
	styleIncludes: [
		'./bower_components/foundation/scss'
	],
	scripts: [
		'./bower_components/jquery/dist/jquery.js',
		'./bower_components/foundation/js/foundation/foundation.js',
		'./bower_components/foundation/js/foundation/foundation.topbar.js',
		'./bower_components/fastclick/lib/fastclick.js',
		'./assets/scripts/app.js'
	]
};

gulp.task('styles', function () {
	return gulp
		.src(paths.styles)
		.pipe(sass({includePaths: paths.styleIncludes}))
		.pipe(concat('app.css'))
		.pipe(gulp.dest('./public/stylesheets'))
});

gulp.task('scripts', function () {
	gulp
		.src(paths.scripts)
		.pipe(uglify())
		.pipe(concat('app.js'))
		.pipe(gulp.dest('./public/js'));

	return gulp
		.src(['./bower_components/modernizr/modernizr.js'])
		.pipe(gulp.dest('./public/js'))
});

gulp.task('watch', function(){
	gulp.watch(paths.styles.concat(paths.styleIncludes) , ['styles']);
	gulp.watch(paths.scripts , ['scripts']);
});

gulp.task('default', ['styles', 'scripts', 'watch']);