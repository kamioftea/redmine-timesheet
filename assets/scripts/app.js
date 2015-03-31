/**
 * Created by Jeff on 23/03/2015.
 */
$(document).foundation();

$(function(){
	$('[data-swap]').on('click', function(e){
		e.preventDefault();
		
		var $this = $(this);
		var $target = $($this.data('swap'));
		
		$target.show();
		$this.hide();
	})
});
