const { exec, execSync, execFileSync } = require("child_process");
const fs = require("fs"); // Load the File System to execute our common tasks (CRUD)

let childProcess;

/**
 * Function to create a file in a specified path with a specified content
 * @param path: path where the file needs to be created
 * @param content: content of the file that will be created
 */
exports.createFile = (path, content) => {
  fs.writeFile(path, content, err => {
    if (err) {
      toast.error(err.message);
      return;
    }
  });
};

/**
 * @param command: shell command to execute (to concatenate commands use && notation)
 * @param callback: function called after the execution of the shell comand to reset state in the main file
 */

exports.executeShellCommand = (
  command,
  callback,
  err_callback
) => {
  console.log("exec " + command);
  childProcess = exec(
    command,
    { maxBuffer: 1024 * 1024 * 1024 },
    (err, stdout, stderr) => {
      if (err) {
        // node couldn't execute the command
        console.log(err);
      }

      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
			
      msg = JSON.stringify({stderr: stderr, stdout: stdout})

      callback(msg);
    }
  );

  childProcess.stderr.on('data', (data) => {
    err_callback(data);
	});
};


exports.killShellCommand = () => {
  if (childProcess != undefined) {
    process.kill(childProcess.pid, 9);
  } else {
    console.log("No process is running");
  }
};
