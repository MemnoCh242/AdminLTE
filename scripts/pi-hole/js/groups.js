var table;
const token = $("#token").html();
var info = null;

function showAlert(type, icon, message) {
  var msg = "";
  switch (type) {
    case "info":
      info = $.notify({
        type: "info",
        icon: "glyphicon glyphicon-time",
        message: "&nbsp;" + message
      });
      break;
    case "success":
      msg = "&nbsp;Successfully " + message;
      if (info) {
        info.update({ type: "success", icon: icon, message: msg });
      } else {
        $.notify({ type: "success", icon: icon, message: msg });
      }
      break;
    case "warning":
      msg = "&nbsp;" + message;
      if (info) {
        info.update({
          type: "warning",
          icon: "glyphicon glyphicon-warning-sign",
          message: msg
        });
      } else {
        $.notify({
          type: "warning",
          icon: "glyphicon glyphicon-warning-sign",
          message: msg
        });
      }
      break;
    case "error":
      msg = "&nbsp;Error, something went wrong!<br><pre>" + message + "</pre>";
      if (info) {
        info.update({
          type: "danger",
          icon: "glyphicon glyphicon-remove",
          message: msg
        });
      } else {
        $.notify({
          type: "danger",
          icon: "glyphicon glyphicon-remove",
          message: msg
        });
      }
      break;
    default:
      return;
  }
}

$(document).ready(function() {
  $("#btnAdd").on("click", addGroup);

  table = $("#groupsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_groups", token: token },
      type: "POST"
    },
    order: [[1, "asc"]],
    columns: [
      { data: "id", width: "60px" },
      { data: "enabled", searchable: false },
      { data: "name" },
      { data: "description" },
      { data: null, width: "60px", orderable: false }
    ],
    drawCallback: function(settings) {
      $(".deleteGroup").on("click", deleteGroup);
      $(".editGroup").on("click", editGroup);
    },
    rowCallback: function(row, data) {
      const disabled = data.enabled === 0;
      $("td:eq(1)", row).html(
        '<input type="checkbox" id="status"' +
          (disabled ? "" : " checked") +
          ">"
      );
      $("#status", row).bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });

      $("td:eq(2)", row).html('<input id="name" class="form-control">');
      $("#name", row).val(data.name);

      $("td:eq(3)", row).html('<input id="desc" class="form-control">');
      const desc = data.description !== null ? data.description : "";
      $("#desc", row).val(desc);

      let button =
        '<button class="btn btn-success btn-xs editGroup" type="button" data-id="' +
        data.id +
        '">' +
        '<span class="glyphicon glyphicon-pencil"></span>' +
        "</button>";
      if (data.id !== 0) {
        button +=
          " &nbsp;" +
          '<button class="btn btn-danger btn-xs deleteGroup" type="button" data-id="' +
          data.id +
          '">' +
          '<span class="glyphicon glyphicon-trash"></span>' +
          "</button>";
      }
      $("td:eq(4)", row).html(button);
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("groups-table", JSON.stringify(data));
    },
    stateLoadCallback: function(settings) {
      // Receive previous state from client's local storage area
      var data = localStorage.getItem("groups-table");
      // Return if not available
      if (data === null) {
        return null;
      }
      data = JSON.parse(data);
      // Always start on the first page to show most recent queries
      data.start = 0;
      // Always start with empty search field
      data.search.search = "";
      // Apply loaded state to table
      return data;
    }
  });
});

function addGroup() {
  var name = $("#new_name").val();
  var desc = $("#new_desc").val();

  showAlert("info", "", "Adding group " + name + "...");

  if (name.length === 0) {
    showAlert("warning", "", "Please specify a group name");
    return;
  }

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "add_group", name: name, desc: desc, token: token },
    success: function(response) {
      if (response.success) {
        showAlert("success", "glyphicon glyphicon-plus", "added group " + name);
        $("#new_name").val("");
        $("#new_desc").val("");
        table.ajax.reload();
      } else showAlert("error", "", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while adding new group: " + jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function editGroup() {
  var tr = $(this).closest("tr");
  var id = tr.find("td:eq(0)").html();
  var name = tr.find("#name").val();
  var status = tr.find("#status").is(":checked") ? 1 : 0;
  var desc = tr.find("#desc").val();

  showAlert("info", "", "Editing group " + name + "...");
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "edit_group",
      id: id,
      name: name,
      desc: desc,
      status: status,
      token: token
    },
    success: function(response) {
      if (response.success) {
        showAlert(
          "success",
          "glyphicon glyphicon-pencil",
          "edited group " + name
        );
        table.ajax.reload();
      } else showAlert("error", "", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while editing group with ID " + id + ": " + jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function deleteGroup() {
  var id = $(this).attr("data-id");
  var tr = $(this).closest("tr");
  var name = tr.find("#name").val();

  showAlert("info", "", "Deleting group " + name + "...");
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_group", id: id, token: token },
    success: function(response) {
      if (response.success) {
        showAlert(
          "success",
          "glyphicon glyphicon-trash",
          "deleted group " + name
        );
        table.ajax.reload();
      } else showAlert("error", "", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while deleting group with ID " + id + ": " + jqXHR.responseText
      );
      console.log(exception);
    }
  });
}
