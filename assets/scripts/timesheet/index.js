/**
 * Created by jeff on 29/05/2015.
 */
$(function () {
	var issue_project_id = $('#issue_id').asEventStream('change')
		.map(function (event) {
			return $(':selected', event.currentTarget).data('projectId')
		})
		.toProperty();

	var $project_id_select = $('#project_id');
	issue_project_id.assign($project_id_select, 'prop', 'disabled');
	issue_project_id.assign($project_id_select, 'val');
});