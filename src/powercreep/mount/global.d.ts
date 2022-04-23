interface PowerCreep {
  // utils
  processBasicWorkState(rType?: ResourceConstant): void
  processBasicWithdraw(distination: Structure, rType: ResourceConstant): void
  processBasicTransfer(distination: Structure, rType: ResourceConstant): void
}
