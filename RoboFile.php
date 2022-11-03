<?php

// @codingStandardsIgnoreStart

/**
 * Base tasks for setting up a module to test within a full Drupal environment.
 *
 * @class RoboFile
 * @codeCoverageIgnore
 */
class RoboFile extends \Robo\Tasks {

  /**
   * Command to build the environment
   *
   * @return \Robo\Result
   *   The result of the collection of tasks.
   */
  public function jobBuild() {
    $collection = $this->collectionBuilder();
    $collection->addTaskList($this->runComposer());
    return $collection->run();
  }

  /**
   * Command to run unit tests.
   *
   * @return \Robo\Result
   *   The result of the collection of tasks.
   */
  public function jobUnitTests() {
    $collection = $this->collectionBuilder();
    $collection->addTaskList($this->runUnitTests());
    return $collection->run();
  }

  /**
   * Command to generate a coverage report.
   *
   * @return \Robo\Result
   *   The result of the collection of tasks.
   */
  public function jobCoverageReport() {
    $collection = $this->collectionBuilder();
    $collection->addTaskList($this->runCoverageReport());
    return $collection->run();
  }

  /**
   * Command to check for Drupal's Coding Standards.
   *
   * @return \Robo\Result
   *   The result of the collection of tasks.
   */
  public function jobCodingStandards() {
    $collection = $this->collectionBuilder();
    $collection->addTaskList($this->runCodeSniffer());
    return $collection->run();
  }
  
  /**
   * Command to fix Drupal's Coding Standards.
   *
   * @return \Robo\Result
   *   The result of the collection of tasks.
   */
  public function jobCodingStandardsFixer() {
    $collection = $this->collectionBuilder();
    $collection->addTaskList($this->runCodeSnifferFixer());
    return $collection->run();
  }

  /**
   * Command to run existing site tests.
   *
   * @return \Robo\Result
   *   The result tof the collection of tasks.
   */
  public function jobExistingSiteTests() {
    $collection = $this->collectionBuilder();
    $collection->addTaskList($this->runUpdateDatabase());
    $collection->addTaskList($this->runExistingSiteTests());
    return $collection->run();
  }

  /**
   * Command to run Chrome headless.
   *
   * @return \Robo\Result
   *   The result tof the task
   */
  public function runChromeHeadless() {
    return $this->taskExec('google-chrome-unstable --disable-gpu --headless --no-sandbox --remote-debugging-address=0.0.0.0 --remote-debugging-port=9222')->run();
  }

  /**
   * Updates the database.
   *
   * @return \Robo\Task\Base\Exec[]
   *   An array of tasks.
   */
  protected function runUpdateDatabase() {
    $tasks = [];
    $tasks[] = $this->drush()
      ->args('updatedb')
      ->option('yes')
      ->option('verbose');
    $tasks[] = $this->drush()
      ->args('config:import')
      ->option('yes')
      ->option('verbose');
    $tasks[] = $this->drush()->args('cache:rebuild')->option('verbose');
    return $tasks;
  }

  /**
   * Run unit tests.
   *
   * @return \Robo\Task\Base\Exec[]
   *   An array of tasks.
   */
  protected function runUnitTests() {
    $tasks = [];
    $tasks[] = $this->taskFilesystemStack()
      ->mkdir('artifacts/phpunit');
    $tasks[] = $this->taskExecStack()
      ->exec('vendor/bin/phpunit --debug --verbose --testsuite=unit,kernel,functional --log-junit=artifacts/phpunit/testresult.xml');
    return $tasks;
  }

  /**
   * Generates a code coverage report.
   *
   * @return \Robo\Task\Base\Exec[]
   *   An array of tasks.
   */
  protected function runCoverageReport() {
    $tasks = [];
    $tasks[] = $this->taskFilesystemStack()
      ->mkdir('artifacts/phpunit/coverage-xml')
      ->mkdir('artifacts/phpunit/coverage-html');
    $tasks[] = $this->taskExecStack()
      ->exec('vendor/bin/phpunit --debug --verbose \
      --colors=never \
      --coverage-html ../artifacts/phpunit/coverage-html \
      --coverage-clover ../artifacts/phpunit/coverage.xml \
      --testsuite=unit,kernel,functional --log-junit=artifacts/phpunit/testresult.xml');
    return $tasks;
  }

  /**
   * Sets up and runs code sniffer.
   *
   * @return \Robo\Task\Base\Exec[]
   *   An array of tasks.
   */
  protected function runCodeSniffer() {
    $tasks = [];
    $tasks[] = $this->taskFilesystemStack()
      ->mkdir('artifacts/phpcs');
    $tasks[] = $this->taskExecStack()
      ->exec('vendor/bin/phpcs \
      --standard=Drupal,DrupalPractice \
      --extensions=php,module,inc,install,profile,theme,yml \
      --ignore=*.css,libraries/*,dist/*,styleguide/*,node_modules/*,README.md,README.txt,*.min.js \
      --report=junit \
      --report-junit=artifacts/phpcs/phpcs.xml web/modules/custom');
    return $tasks;
  }
  
  /**
   * Sets up and runs code sniffer fixer.
   *
   * @return \Robo\Task\Base\Exec[]
   *   An array of tasks.
   */
  protected function runCodeSnifferFixer() {
    $tasks = [];
    $tasks[] = $this->taskExecStack()
      ->exec('vendor/bin/phpcbf \
      --standard=Drupal,DrupalPractice \
      --extensions=php,module,inc,install,profile,theme,yml \
      --ignore=*.css,libraries/*,dist/*,styleguide/*,node_modules/*,README.md,README.txt,*.min.js \
      web/modules/custom');
    return $tasks;
  }

  /**
   * Runs existing site tests.
   *
   * @return \Robo\Task\Base\Exec[]
   *   An array of tasks.
   */
  protected function runExistingSiteTests() {
    $CI_PROJECT_DIR = getenv('CI_PROJECT_DIR');
    $tasks = [];
    $tasks[] = $this->taskExec('sed -ri -e \'s!/var/www/html/web!' . $CI_PROJECT_DIR . '/web!g\' /etc/apache2/sites-available/*.conf /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf');
    $tasks[] = $this->taskExec('service apache2 start');
    $tasks[] = $this->taskExec('vendor/bin/phpunit --debug --verbose --bootstrap=vendor/weitzman/drupal-test-traits/src/bootstrap-fast.php --testsuite=existing-site,existing-site-javascript');
    return $tasks;
  }

  /**
   * Return drush with default arguments.
   *
   * @return \Robo\Task\Base\Exec
   *   A drush exec command.
   */
  protected function drush() {
    return $this->taskExec('vendor/bin/drush');
  }

  /**
   * Runs composer commands.
   *
   * @return \Robo\Task\Base\Exec[]
   *   An array of tasks.
   */
  protected function runComposer() {
    $tasks = [];
    $tasks[] = $this->taskComposerValidate()->noCheckPublish();
    $tasks[] = $this->taskComposerInstall()
      ->noInteraction()
      ->preferDist()
      ->optimizeAutoloader();
    return $tasks;
  }

}
