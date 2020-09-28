const { getContract, web3, group, getAccounts, str, getDefiAddresses, eth } = require('./test-lib');
const { singletons } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const UniswapPoolAdapterFactory = getContract('UniswapPoolAdapterFactory');
const UniswapPoolAdapter = getContract('UniswapPoolAdapter');
const FarmerToken = getContract('FarmerToken');
const FarmerTokenFactory = getContract('FarmerTokenFactory');
const WrapperFactory = getContract('WrapperFactory');
const Wrapped777 = getContract('Wrapped777');
const TestERC20 = getContract('TestERC20');
const TestUniswapRouter = getContract('TestUniswapRouter');
const TestUniswapPair = getContract('TestUniswapPair');
const IERC20 = getContract('IERC20');
const IWETH = getContract('IWETH');

const ONE_GWEI = 1000000000;
const { toBN } = web3.utils;

group('Uniswap Pools', (accounts) => {
  const [defaultSender, user] = getAccounts(accounts);

  let weth, dai;

  before(() => singletons.ERC1820Registry(defaultSender));

  it('should join and exit a balancer pool with ETH', async function() {
    this.timeout(3000);

    const uniswapRouter = await TestUniswapRouter.new();

    const dai = await TestERC20.new();
    const weth = await IWETH.at(await uniswapRouter.WETH());

    const pair = await TestUniswapPair.new(weth.address, dai.address);
    await dai.transfer(pair.address, eth(50));
    await weth.deposit({ value: eth(1) });
    await weth.transfer(pair.address, eth(1));
    await pair.mint(defaultSender);

    const wrapperFactory = await WrapperFactory.new();
    const poolFactory = await UniswapPoolAdapterFactory.new(uniswapRouter.address);

    await wrapperFactory.createWrapper(pair.address);
    const poolWrapperAddress = await wrapperFactory.calculateWrapperAddress(pair.address);
    const poolWrapper = await Wrapped777.at(poolWrapperAddress);

    await poolFactory.createAdapter(poolWrapperAddress);
    const poolAdapter = await UniswapPoolAdapter.at(await poolFactory.calculateAdapterAddress(poolWrapperAddress));

    await poolAdapter.sendTransaction({ value: eth(1), from: user });

    expect(await str(poolWrapper.balanceOf(user))).to.equal('2924533156400558528');
  });

  // it('should join a balancer pool with Dai777', async function() {
  //   this.timeout(3000);

  //   const wrapperFactory = await WrapperFactory.new();
  //   const poolFactory = await BalancerPoolFactory.new(weth);

  //   const bpool = await TestBPool.new([weth, dai]);

  //   await wrapperFactory.createWrapper(bpool.address);
  //   const poolWrapperAddress = await wrapperFactory.calculateWrapperAddress(bpool.address);
  //   const poolWrapper = await Wrapped777.at(poolWrapperAddress);

  //   const daiWrapperAddress = await wrapperFactory.calculateWrapperAddress(dai);
  //   await wrapperFactory.createWrapper(dai);
  //   const daiWrapper = await Wrapped777.at(daiWrapperAddress);
  //   (await IERC20.at(dai)).approve(daiWrapperAddress, eth(1));
  //   await daiWrapper.wrapTo(eth(1), user);

  //   await poolFactory.createWrapper(poolWrapperAddress);
  //   const poolAdapterAddress = await poolFactory.calculateWrapperAddress(poolWrapperAddress);

  //   await daiWrapper.transfer(poolAdapterAddress, eth(1), { from: user });

  //   expect(await str(poolWrapper.balanceOf(user))).to.equal(eth(1));

  //   // Exit
  //   const exitFactory = await BalancerPoolExitFactory.new(weth);

  //   await exitFactory.createWrapper(daiWrapperAddress);
  //   const exitAdapter = await exitFactory.calculateWrapperAddress(daiWrapperAddress);

  //   await poolWrapper.transfer(exitAdapter, eth(1), { from: user });
  //   expect(await str(daiWrapper.balanceOf(user))).to.equal(eth(1));
  // });
});
