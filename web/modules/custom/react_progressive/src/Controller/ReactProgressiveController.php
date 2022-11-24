<?php

namespace Drupal\react_progressive\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Returns responses for React Progressive routes.
 */
class ReactProgressiveController extends ControllerBase {

  /**
   * Builds the response.
   */
  public function build(): array {
    return [
      '#theme' => 'react_progressive',
      '#entity_id' => 1,
    ];
  }

}
